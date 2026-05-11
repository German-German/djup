import os
import json
import logging
from datetime import datetime, date, timedelta
from typing import Dict, Any, Optional

from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.models.database import CommentaryLog, BDCSummary, BDCLoan, MacroIndicator
from app.services import prediction_service

from openai import OpenAI

logger = logging.getLogger(__name__)

def _get_distinct_quarters(db: Session):
    return [q[0] for q in db.query(BDCSummary.quarter).distinct().order_by(desc(BDCSummary.quarter)).all()]

def _build_data_context(db: Session) -> Dict[str, Any]:
    quarters = _get_distinct_quarters(db)
    if not quarters:
        return {}
        
    latest_q = quarters[0]
    prev_q = quarters[1] if len(quarters) > 1 else None
    
    context = {"quarter": latest_q}
    
    # 1. Universe Yield & Non-Accrual Rate
    latest_summaries = db.query(BDCSummary).filter(BDCSummary.quarter == latest_q).all()
    if latest_summaries:
        context["universe_yield"] = sum(s.weighted_avg_yield for s in latest_summaries if s.weighted_avg_yield) / len(latest_summaries)
        context["non_accrual_rate"] = sum(s.non_accrual_rate_pct for s in latest_summaries if s.non_accrual_rate_pct) / len(latest_summaries)
        context["net_deployment_sum"] = sum(s.net_new_deployment for s in latest_summaries if s.net_new_deployment)
    
    # 2. QoQ Changes
    if prev_q:
        prev_summaries = db.query(BDCSummary).filter(BDCSummary.quarter == prev_q).all()
        if prev_summaries:
            prev_yield = sum(s.weighted_avg_yield for s in prev_summaries if s.weighted_avg_yield) / len(prev_summaries)
            prev_na = sum(s.non_accrual_rate_pct for s in prev_summaries if s.non_accrual_rate_pct) / len(prev_summaries)
            context["yield_qoq_change"] = context.get("universe_yield", 0) - prev_yield
            context["non_accrual_qoq_change"] = context.get("non_accrual_rate", 0) - prev_na
            
    # 3. Top Watchlist Borrowers (fair_to_par_ratio < 0.8 or is_non_accrual)
    watch_loans = db.query(BDCLoan).filter(
        BDCLoan.quarter == latest_q,
        ((BDCLoan.fair_to_par_ratio < 0.8) | (BDCLoan.is_non_accrual == True))
    ).order_by(BDCLoan.fair_value.desc()).limit(5).all()
    
    context["top_watchlist_borrowers"] = [
        {"borrower": l.borrower_name, "industry": l.industry, "fair_value": l.fair_value, "ratio": l.fair_to_par_ratio}
        for l in watch_loans
    ]
    
    # 4. FRED Macro Context
    macros = db.query(MacroIndicator).order_by(desc(MacroIndicator.date)).all()
    macro_dict = {}
    for m in macros:
        if m.series_id not in macro_dict:
            macro_dict[m.series_id] = m.value
    
    context["macro_context"] = {
        "hy_spreads": macro_dict.get("BAMLH0A0HYM2"),
        "sofr": macro_dict.get("sofr"),
        "yield_curve_10y_2y": macro_dict.get("T10Y2Y")
    }
    
    # 5. Top 3 Stress Signals
    try:
        stress_res = prediction_service.get_stress_signals(db)
        if "signals" in stress_res:
            high_stress = [s for s in stress_res["signals"] if s["stress_tier"] == "high"]
            high_stress.sort(key=lambda x: x["stress_probability"], reverse=True)
            context["top_stress_signals"] = high_stress[:3]
    except Exception as e:
        logger.error(f"Failed to get stress signals: {e}")
        
    return context

def generate_commentary(db: Session, force_regenerate: bool = False) -> Dict[str, Any]:
    # Check cache
    today = date.today()
    if not force_regenerate:
        recent_log = db.query(CommentaryLog).filter(CommentaryLog.date >= today - timedelta(days=7)).order_by(desc(CommentaryLog.date)).first()
        if recent_log:
            return {
                "date": recent_log.date.isoformat(),
                "commentary_text": recent_log.commentary_text,
                "data_snapshot": json.loads(recent_log.data_snapshot_json) if recent_log.data_snapshot_json else {},
                "cached": True
            }
            
    # Gather Data
    context = _build_data_context(db)
    
    # Call OpenAI
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        # Mock behavior for missing API key
        commentary_text = "Market Commentary unavailable: OPENAI_API_KEY is not configured. Please set the API key to generate insights."
    else:
        try:
            client = OpenAI(api_key=api_key)
            prompt = f"""You are a private credit market analyst. Based on the following data from BDC quarterly filings and macro indicators, write a 200-word market commentary suitable for a professional audience. Be specific, data-driven, and acknowledge uncertainty where appropriate. Do not fabricate data not in the context below.
Data: {json.dumps(context)}"""

            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a professional financial analyst."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=400,
                temperature=0.4
            )
            commentary_text = response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"OpenAI API call failed: {e}")
            commentary_text = f"Error generating commentary: {e}"
            
    # Save to db
    if "Error" not in commentary_text and "unavailable" not in commentary_text:
        # Check if today's entry already exists
        existing = db.query(CommentaryLog).filter(CommentaryLog.date == today).first()
        if existing:
            existing.commentary_text = commentary_text
            existing.data_snapshot_json = json.dumps(context)
        else:
            new_log = CommentaryLog(
                date=today,
                commentary_text=commentary_text,
                data_snapshot_json=json.dumps(context)
            )
            db.add(new_log)
        db.commit()
        
    return {
        "date": today.isoformat(),
        "commentary_text": commentary_text,
        "data_snapshot": context,
        "cached": False
    }
