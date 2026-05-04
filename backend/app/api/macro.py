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
    
    query = db.query(MacroIndicator).filter(MacroIndicator.series_id.in_(series_list))
    
    if start_date:
        query = query.filter(MacroIndicator.date >= start_date)
    if end_date:
        query = query.filter(MacroIndicator.date <= end_date)
        
    records = query.order_by(MacroIndicator.date).all()
    
    date_map = defaultdict(dict)
    for r in records:
        if isinstance(r.date, datetime.date):
            d_str = r.date.strftime("%Y-%m-%d")
        else:
            d_str = str(r.date)
            
        if r.value is not None:
            date_map[d_str][r.series_id] = r.value
            
    results = []
    for d, vals in date_map.items():
        results.append({"date": d, "values": vals})
        
    results.sort(key=lambda x: x["date"])
    return results
