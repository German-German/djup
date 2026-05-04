from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from collections import defaultdict
import datetime

from app.database import get_db
from app.models.database import MacroIndicator

router = APIRouter()

class MacroOverlayResponse(BaseModel):
    date: str
    values: Dict[str, float]

@router.get("/overlay", response_model=List[MacroOverlayResponse])
def get_macro_overlay(
    series: str = Query("hy_spread,sofr,yield_curve"),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Returns requested macro series values joined by date for overlay charts.
    """
    series_list = series.split(",")
    mapping = {
        "hy_spread": "BAMLH0A0HYM2",
        "sofr": "SOFR",
        "yield_curve": "T10Y2Y",
        "cpi": "CPIAUCSL",
        "ig_spread": "BAMLC0A0CM"
    }
    
    db_series_ids = [mapping.get(s, s) for s in series_list]
    
    query = db.query(MacroIndicator).filter(MacroIndicator.series_id.in_(db_series_ids))
    
    if start_date:
        query = query.filter(MacroIndicator.date >= start_date)
    if end_date:
        query = query.filter(MacroIndicator.date <= end_date)
        
    records = query.order_by(MacroIndicator.date).all()
    
    rev_map = {v: k for k, v in mapping.items()}
    
    date_map = defaultdict(dict)
    for r in records:
        if isinstance(r.date, str):
            d_str = r.date
        elif isinstance(r.date, datetime.date):
            d_str = r.date.strftime("%Y-%m-%d")
        else:
            d_str = str(r.date)
            
        nickname = rev_map.get(r.series_id, r.series_id)
        if r.value is not None:
            date_map[d_str][nickname] = r.value
            
    results = []
    for d, vals in date_map.items():
        results.append({"date": d, "values": vals})
        
    results.sort(key=lambda x: x["date"])
    return results
