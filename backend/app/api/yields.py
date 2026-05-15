from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.database import get_db
from app.services import yield_analytics

router = APIRouter()

class YieldOverviewResponse(BaseModel):
    quarter: Optional[str] = None
    overall_weighted_yield: float = 0.0
    by_loan_type: Dict[str, float] = {}
    by_industry: List[Dict[str, Any]] = []
    yield_range: Dict[str, float] = {}
    total_loans_analyzed: int = 0
    total_fair_value_bn: float = 0.0

class YieldTimeSeriesResponse(BaseModel):
    quarter: str
    overall_yield: float
    first_lien_yield: float
    unitranche_yield: float
    second_lien_yield: float
    loan_count: int
    sofr_rate: float
    implied_spread_over_sofr: float

class SpreadCompressionResponse(BaseModel):
    analysis: List[Dict[str, Any]] = []
    narrative: str = ""
    quarters_compared: Dict[str, Optional[str]] = {}

class IndustryHeatmapResponse(BaseModel):
    industry_name: str
    weighted_yield: float
    portfolio_weight_pct: float
    loan_count: int
    avg_fair_to_par: float

class SpreadCurveResponse(BaseModel):
    tenor_label: str
    avg_spread_bps: float
    loan_count: int

@router.get("/by-bdc")
def get_yield_by_bdc_route(quarter: Optional[str] = None, db: Session = Depends(get_db)):
    """Returns overall weighted yield per BDC for the selected quarter."""
    return yield_analytics.get_yield_by_bdc(db, quarter)

@router.get("/overview", response_model=YieldOverviewResponse)
def get_yield_overview(
    quarter: Optional[str] = None,
    bdc_tickers: Optional[str] = Query(None, description="Comma-separated tickers"),
    loan_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Returns an overview of weighted yields for the portfolio."""
    tickers_list = bdc_tickers.split(",") if bdc_tickers else None
    return yield_analytics.get_weighted_yield_overview(db, quarter, tickers_list, loan_type)

@router.get("/time-series", response_model=List[YieldTimeSeriesResponse])
def get_yield_time_series(
    quarters: int = Query(8),
    bdc_tickers: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Returns time series of yields across loan types."""
    tickers_list = bdc_tickers.split(",") if bdc_tickers else None
    return yield_analytics.get_yield_time_series(db, quarters, tickers_list)

@router.get("/spread-compression", response_model=SpreadCompressionResponse)
def get_spread_compression(db: Session = Depends(get_db)):
    """Returns analysis of spread compression over 1yr and 2yr periods."""
    return yield_analytics.get_spread_compression_analysis(db)

@router.get("/industry-heatmap", response_model=List[IndustryHeatmapResponse])
def get_industry_heatmap(db: Session = Depends(get_db)):
    """Returns top industries by yield and portfolio weight."""
    return yield_analytics.get_industry_yield_heatmap(db)

@router.get("/spread-curve", response_model=List[SpreadCurveResponse])
def get_spread_curve(db: Session = Depends(get_db)):
    """Returns the SOFR spread curve by maturity tenor buckets."""
    return yield_analytics.get_sofr_spread_curve(db)
