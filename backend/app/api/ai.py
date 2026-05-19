"""
Gemini-powered analysis endpoints.

Two endpoints, both designed to be token-light:

  POST /api/ai/analyze         — pulls a short paragraph of analytical
                                  commentary for a given page + payload.
  POST /api/ai/summarize-news  — condenses a list of headlines into a
                                  3-4 sentence digest.

Both endpoints require GEMINI_API_KEY in the environment. When the key is
missing they return a 200 with `available: false` so the frontend can
render a graceful placeholder.

We hit the Gemini REST API directly via httpx (no SDK dependency).
"""
from __future__ import annotations

import json
import logging
import os
import time
from typing import Any, Dict, List, Optional

import httpx
from fastapi import APIRouter
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/ai", tags=["AI"])

# Default to a fast, low-cost model. Override per-call via `model` field.
DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models"
HTTP_TIMEOUT = 20.0

# Simple in-process cache so repeated identical prompts within a few minutes
# don't burn tokens.
_CACHE: Dict[str, tuple[float, Any]] = {}
_CACHE_TTL = 300  # seconds


def _cache_get(key: str):
    item = _CACHE.get(key)
    if not item:
        return None
    ts, val = item
    if (time.time() - ts) > _CACHE_TTL:
        return None
    return val


def _cache_set(key: str, value: Any):
    _CACHE[key] = (time.time(), value)


def _call_gemini(prompt: str, model: str = DEFAULT_MODEL, max_output_tokens: int = 240) -> Optional[str]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None

    url = f"{GEMINI_BASE}/{model}:generateContent"
    body = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": max_output_tokens,
            "topP": 0.9,
        },
    }
    try:
        with httpx.Client(timeout=HTTP_TIMEOUT) as client:
            r = client.post(url, params={"key": api_key}, json=body)
            r.raise_for_status()
            data = r.json()
        candidates = data.get("candidates", [])
        if not candidates:
            return None
        parts = candidates[0].get("content", {}).get("parts", [])
        text = "".join(p.get("text", "") for p in parts).strip()
        return text or None
    except httpx.HTTPStatusError as e:
        logger.warning(f"Gemini {model} HTTP {e.response.status_code}: {e.response.text[:200]}")
        return None
    except Exception as e:
        logger.warning(f"Gemini call failed: {e}")
        return None


# ---------------------------------------------------------------------------
# /api/ai/analyze
# ---------------------------------------------------------------------------

class AnalyzeRequest(BaseModel):
    page: str = Field(..., description="Page name, e.g. 'overview' or 'risk-radar'")
    context: Dict[str, Any] = Field(default_factory=dict, description="Compact JSON of the data shown on the page.")
    style: str = Field("default", description="Hint: default | risk | macro | news")


@router.post("/analyze")
def analyze(req: AnalyzeRequest):
    api_key_present = bool(os.getenv("GEMINI_API_KEY"))

    if not api_key_present:
        return {
            "available": False,
            "page": req.page,
            "text": "Add GEMINI_API_KEY to backend/.env to enable AI commentary on this page.",
            "model": None,
        }

    # Cap the size of the context payload to keep prompt budget tight.
    compact = json.dumps(req.context, default=str, separators=(",", ":"))
    if len(compact) > 4000:
        compact = compact[:4000] + "…"

    cache_key = f"analyze:{req.page}:{req.style}:{hash(compact)}"
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached

    prompt = (
        "You are an institutional private-credit analyst writing for a Bloomberg-terminal-style "
        "dashboard. The user is viewing the '" + req.page + "' page. Below is a compact JSON of "
        "the metrics and series currently shown.\n\n"
        f"DATA:\n{compact}\n\n"
        "Write exactly 3 short, dense sentences (max ~70 words total). "
        "Lead with the most actionable observation, then a risk/opportunity, then a near-term watchpoint. "
        "No headers, no bullets, no preamble, no markdown. Plain prose. "
        "Use specific numbers from the data. Avoid hedging language."
    )

    text = _call_gemini(prompt, max_output_tokens=200)
    out = {
        "available": True,
        "page": req.page,
        "text": text or "AI commentary is temporarily unavailable. Retry in a moment.",
        "model": DEFAULT_MODEL,
    }
    if text:
        _cache_set(cache_key, out)
    return out


# ---------------------------------------------------------------------------
# /api/ai/summarize-news
# ---------------------------------------------------------------------------

class NewsItem(BaseModel):
    title: str
    source: Optional[str] = None
    publishedAt: Optional[str] = None


class SummarizeNewsRequest(BaseModel):
    items: List[NewsItem]


@router.post("/summarize-news")
def summarize_news(req: SummarizeNewsRequest):
    if not os.getenv("GEMINI_API_KEY"):
        return {
            "available": False,
            "text": "Add GEMINI_API_KEY to backend/.env to enable AI news summarisation.",
            "items_seen": len(req.items),
        }

    # Cap to 12 items, titles only — keeps tokens minimal.
    titles = [
        f"- [{(it.source or 'Wire')}] {it.title}"
        for it in req.items[:12]
        if it.title
    ]
    if not titles:
        return {"available": True, "text": "No headlines to summarise.", "items_seen": 0}

    cache_key = "news:" + str(hash("\n".join(titles)))
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached

    prompt = (
        "Below are the latest business / markets headlines. Write a 3-4 sentence digest "
        "in plain prose. Highlight the most market-moving story first; group related items. "
        "No preamble, no bullets, no markdown.\n\n"
        + "\n".join(titles)
    )

    text = _call_gemini(prompt, max_output_tokens=220)
    out = {
        "available": True,
        "text": text or "Summarisation temporarily unavailable.",
        "items_seen": len(titles),
        "model": DEFAULT_MODEL,
    }
    if text:
        _cache_set(cache_key, out)
    return out
