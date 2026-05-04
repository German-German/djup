from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.database import get_db
from app.services import manager_analytics

router = APIRouter()

class ManagerScorecardResponse(BaseModel):
    ticker: str
    bdc_name: str
    portfolio_size_bn: float
    weighted_avg_yield: float
    non_accrual_rate_pct: float
    first_lien_pct: float
    nav_premium_discount_pct: float
    debt_to_equity: float
    net_deployment_mm: float
    yield_risk_ratio: float
    risk_tier: str

class BDCDeepDiveResponse(BaseModel):
    summary: Dict[str, Any]
    yield_history: List[Dict[str, Any]]
    top_10_positions: List[Dict[str, Any]]
    industry_mix: List[Dict[str, Any]]
    loan_type_mix: List[Dict[str, Any]]
    quarterly_activity: List[Dict[str, Any]]

@router.get("/matrix", response_model=List[ManagerScorecardResponse])
def get_matrix(quarter: Optional[str] = None, db: Session = Depends(get_db)):
    """Returns manager comparison scorecard matrix sorted by yield-risk ratio."""
    return manager_analytics.build_manager_comparison_matrix(db, quarter)

@router.get("/deep-dive/{ticker}", response_model=BDCDeepDiveResponse)
def get_deep_dive(ticker: str, db: Session = Depends(get_db)):
    """Returns a full profile deep dive for a specific BDC."""
    return manager_analytics.get_bdc_deep_dive(db, ticker.upper())
