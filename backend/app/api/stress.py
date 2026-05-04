from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.database import get_db
from app.services import stress_analytics

router = APIRouter()

class NonAccrualTrendResponse(BaseModel):
    quarter: str
    universe_rate: float
    by_bdc: Dict[str, float]

class StressDashboardResponse(BaseModel):
    quarter: Optional[str] = None
    universe_non_accrual_rate: float = 0.0
    bdc_count_above_3pct: int = 0
    nav_discount_count: int = 0
    worst_bdc: Optional[Dict[str, Any]] = None
    best_bdc: Optional[Dict[str, Any]] = None
    fair_to_par_below_90: int = 0
    total_distressed_fair_value_mm: float = 0.0

class WatchlistBorrowerResponse(BaseModel):
    borrower_name: str
    bdc_count: int
    bdc_list: List[str]
    total_fair_value_mm: float
    avg_fair_to_par: float
    is_non_accrual_any: bool
    industry: str

class NavPremiumHistoryResponse(BaseModel):
    quarter: str
    universe_avg_premium_discount: float
    by_bdc: Dict[str, float]

class FairValueDistributionResponse(BaseModel):
    count: int
    fair_value: float

@router.get("/non-accrual", response_model=List[NonAccrualTrendResponse])
def get_non_accrual(quarters: int = 8, db: Session = Depends(get_db)):
    """Returns non-accrual trends over quarters."""
    return stress_analytics.get_non_accrual_trends(db, quarters)

@router.get("/dashboard", response_model=StressDashboardResponse)
def get_dashboard(db: Session = Depends(get_db)):
    """Returns stress dashboard summary metrics."""
    return stress_analytics.get_stress_dashboard(db)

@router.get("/watchlist", response_model=List[WatchlistBorrowerResponse])
def get_watchlist(db: Session = Depends(get_db)):
    """Returns borrowers appearing in multiple BDCs that may be stressed."""
    return stress_analytics.get_watchlist_borrowers(db)

@router.get("/nav-premium", response_model=List[NavPremiumHistoryResponse])
def get_nav_premium(db: Session = Depends(get_db)):
    """Returns history of NAV premiums/discounts."""
    return stress_analytics.get_nav_premium_history(db)

@router.get("/fair-value-dist", response_model=Dict[str, FairValueDistributionResponse])
def get_fair_value_dist(quarter: Optional[str] = None, db: Session = Depends(get_db)):
    """Returns distribution of loans by fair value to par buckets."""
    return stress_analytics.get_fair_value_distribution(db, quarter)
