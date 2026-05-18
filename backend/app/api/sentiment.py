from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import SessionLocal
from app.models.database import NLPSentiment
from app.services import nlp_service

router = APIRouter()

def _chrono_quarter_key(q):
    """Sort key turning 'Q1_24' into '24_Q1' so years sort before quarter index."""
    return f"{q[-2:]}_{q[:2]}" if q and len(q) >= 5 else (q or "")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/overview")
def get_sentiment_overview(db: Session = Depends(get_db)):
    """
    Aggregated sentiment stats across all BDCs for the latest quarter.
    """
    # Find latest quarter (chronological, not string-desc)
    all_quarters = [row[0] for row in db.query(NLPSentiment.quarter).distinct().all() if row[0]]
    if not all_quarters:
        return {"avg_sentiment": 0, "bdc_count": 0}
    q = sorted(all_quarters, key=_chrono_quarter_key)[-1]
    stats = db.query(
        func.avg(NLPSentiment.net_sentiment_score).label("avg_score"),
        func.count(NLPSentiment.id).label("count")
    ).filter(NLPSentiment.quarter == q).first()
    
    # Get most positive and negative
    most_pos = db.query(NLPSentiment).filter(NLPSentiment.quarter == q).order_by(NLPSentiment.net_sentiment_score.desc()).first()
    most_neg = db.query(NLPSentiment).filter(NLPSentiment.quarter == q).order_by(NLPSentiment.net_sentiment_score.asc()).first()
    
    return {
        "quarter": q,
        "avg_sentiment": stats.avg_score or 0,
        "total_bdcs": stats.count,
        "top_performer": {"ticker": most_pos.bdc_ticker, "score": most_pos.net_sentiment_score} if most_pos else None,
        "bottom_performer": {"ticker": most_neg.bdc_ticker, "score": most_neg.net_sentiment_score} if most_neg else None
    }

@router.get("/time-series")
def get_sentiment_time_series(db: Session = Depends(get_db)):
    """
    Sentiment scores per BDC per quarter (last 8 quarters).
    """
    results = db.query(NLPSentiment).order_by(NLPSentiment.quarter.asc()).all()
    
    # Transform to format: { quarter: "Q1_24", ARCC: 0.5, OBDC: 0.2, universe: 0.35 }
    data = {}
    for entry in results:
        q = entry.quarter
        if q not in data:
            data[q] = {"quarter": q}
        data[q][entry.bdc_ticker] = entry.net_sentiment_score
        
    # Calculate universe average per quarter
    for q in data:
        scores = [v for k, v in data[q].items() if k != "quarter"]
        data[q]["universe"] = sum(scores) / len(scores) if scores else 0
        
    ordered = sorted(data.values(), key=lambda x: _chrono_quarter_key(x["quarter"]))
    return ordered[-8:]

@router.get("/keywords")
def get_keyword_trends(db: Session = Depends(get_db)):
    """
    Keyword frequency trends over time.
    """
    results = db.query(
        NLPSentiment.quarter,
        func.sum(NLPSentiment.keyword_spread_compression).label("spread_compression"),
        func.sum(NLPSentiment.keyword_dry_powder).label("dry_powder"),
        func.sum(NLPSentiment.keyword_deal_flow).label("deal_flow"),
        func.sum(NLPSentiment.keyword_non_accrual).label("non_accrual"),
        func.sum(NLPSentiment.keyword_origination).label("origination"),
        func.sum(NLPSentiment.keyword_competition).label("competition")
    ).group_by(NLPSentiment.quarter).all()

    rows = [
        {
            "quarter": r.quarter,
            "spread_compression": r.spread_compression,
            "dry_powder": r.dry_powder,
            "deal_flow": r.deal_flow,
            "non_accrual": r.non_accrual,
            "origination": r.origination,
            "competition": r.competition
        }
        for r in results
    ]
    return sorted(rows, key=lambda x: _chrono_quarter_key(x["quarter"]))

@router.post("/run")
def trigger_sentiment_run(quarter: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Triggers a new sentiment run for all BDCs.
    """
    background_tasks.add_task(nlp_service.run_sentiment_for_all_bdcs, db, quarter)
    return {"message": f"Sentiment analysis run for {quarter} started in background."}
