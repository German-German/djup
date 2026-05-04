from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.database import get_db
from app.services import dealflow_analytics

router = APIRouter()

class DealFlowTrendResponse(BaseModel):
    quarter_label: str
    total_new_originations_bn: float
    total_repayments_bn: float
    net_deployment_bn: float
    avg_new_origination_yield: float

class OriginationSectorResponse(BaseModel):
    industry: str
    fair_value_mm: float
    loan_count: int
    avg_yield: Optional[float] = None
    pct_of_total: float

class HoldSizeTrendResponse(BaseModel):
    quarter: str
    avg_loan_size: float
    median_loan_size: float
    max_loan_size: float

@router.get("/trends", response_model=List[DealFlowTrendResponse])
def get_trends(quarters: int = Query(8), db: Session = Depends(get_db)):
    """Returns deal flow trends (originations vs repayments)."""
    return dealflow_analytics.get_deal_flow_trends(db, quarters)

@router.get("/by-sector", response_model=List[OriginationSectorResponse])
def get_by_sector(quarter: Optional[str] = None, db: Session = Depends(get_db)):
    """Returns new originations broken down by industry sector."""
    return dealflow_analytics.get_origination_by_sector(db, quarter)

@router.get("/hold-sizes", response_model=List[HoldSizeTrendResponse])
def get_hold_sizes(db: Session = Depends(get_db)):
    """Returns hold size trends (avg, median, max) per quarter."""
    return dealflow_analytics.get_hold_size_trends(db)
