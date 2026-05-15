import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, date
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, nullslast
import numpy as np

from app.models.database import BDCLoan, MacroIndicator

logger = logging.getLogger(__name__)

def _get_latest_quarter(db: Session) -> str:
    result = db.query(BDCLoan.quarter).order_by(desc(BDCLoan.quarter)).first()
    return result[0] if result and result[0] else None

def get_weighted_yield_overview(db: Session, quarter: str = None, bdc_tickers: list = None, loan_type: str = None) -> dict:
    if not quarter:
        quarter = _get_latest_quarter(db)
        if not quarter:
            return {}

    query = db.query(BDCLoan).filter(BDCLoan.quarter == quarter)
    
    if bdc_tickers:
        query = query.filter(BDCLoan.bdc_ticker.in_(bdc_tickers))
        
    if loan_type:
        query = query.filter(BDCLoan.loan_type == loan_type)
    else:
        # Default: exclude "equity"
        query = query.filter(func.lower(BDCLoan.loan_type) != "equity")

    loans = query.all()
    if not loans:
        return {}

    total_fair_value = sum((l.fair_value or 0) for l in loans)
    
    # Calculate overall weighted yield
    overall_weighted_yield = 0
    if total_fair_value > 0:
        overall_weighted_yield = sum((l.interest_rate or 0) * (l.fair_value or 0) for l in loans) / total_fair_value

    # Yield range statistics
    yields = [l.interest_rate for l in loans if l.interest_rate is not None]
    yield_range = {}
    if yields:
        yield_range = {
            "min": min(yields),
            "max": max(yields),
            "median": float(np.median(yields)),
            "p25": float(np.percentile(yields, 25)),
            "p75": float(np.percentile(yields, 75))
        }

    # By loan type
    by_loan_type = {}
    for lt in ["first_lien", "unitranche", "second_lien", "mezzanine"]:
        type_loans = [l for l in loans if (l.loan_type or "").lower().replace(" ", "_") == lt]
        type_fv = sum((l.fair_value or 0) for l in type_loans)
        if type_fv > 0:
            by_loan_type[lt] = sum((l.interest_rate or 0) * (l.fair_value or 0) for l in type_loans) / type_fv
        else:
            by_loan_type[lt] = 0.0

    # By industry (Top 10 by portfolio weight)
    industry_fv = {}
    industry_yield_num = {}
    for l in loans:
        ind = l.industry or "Unknown"
        fv = l.fair_value or 0
        w_yield = (l.interest_rate or 0) * fv
        
        industry_fv[ind] = industry_fv.get(ind, 0) + fv
        industry_yield_num[ind] = industry_yield_num.get(ind, 0) + w_yield

    industry_stats = []
    for ind, fv in industry_fv.items():
        if fv > 0:
            w_yield = industry_yield_num[ind] / fv
            industry_stats.append({
                "industry": ind,
                "fair_value": fv,
                "weighted_yield": w_yield,
                "portfolio_weight": fv / total_fair_value
            })

    industry_stats.sort(key=lambda x: x["portfolio_weight"], reverse=True)
    by_industry = industry_stats[:10]

    return {
        "quarter": quarter,
        "overall_weighted_yield": overall_weighted_yield,
        "by_loan_type": by_loan_type,
        "by_industry": by_industry,
        "yield_range": yield_range,
        "total_loans_analyzed": len(loans),
        "total_fair_value_bn": total_fair_value / 1e9
    }

def get_yield_by_bdc(db: Session, quarter: str = None) -> Dict[str, float]:
    if not quarter:
        quarter = _get_latest_quarter(db)
        if not quarter:
            return {}

    loans = db.query(BDCLoan).filter(
        BDCLoan.quarter == quarter,
        func.lower(BDCLoan.loan_type) != "equity"
    ).all()

    bdc_data = {}
    for l in loans:
        ticker = l.bdc_ticker
        if not ticker:
            continue
        if ticker not in bdc_data:
            bdc_data[ticker] = {"fv": 0, "weighted_yield_num": 0}
        
        fv = l.fair_value or 0
        bdc_data[ticker]["fv"] += fv
        bdc_data[ticker]["weighted_yield_num"] += (l.interest_rate or 0) * fv

    results = {}
    for ticker, data in bdc_data.items():
        if data["fv"] > 0:
            results[ticker] = data["weighted_yield_num"] / data["fv"]
        else:
            results[ticker] = 0.0

    return results

def get_yield_time_series(db: Session, quarters: int = 8, bdc_tickers: list = None) -> List[Dict]:
    # Get last N quarters available
    distinct_quarters_q = db.query(BDCLoan.quarter).distinct().order_by(desc(BDCLoan.quarter))
    if bdc_tickers:
        distinct_quarters_q = distinct_quarters_q.filter(BDCLoan.bdc_ticker.in_(bdc_tickers))
        
    recent_quarters = [q[0] for q in distinct_quarters_q.limit(quarters).all()]
    if not recent_quarters:
        return []
        
    recent_quarters.sort() # Ascending order for chart

    results = []
    for q in recent_quarters:
        query = db.query(BDCLoan).filter(BDCLoan.quarter == q)
        if bdc_tickers:
            query = query.filter(BDCLoan.bdc_ticker.in_(bdc_tickers))
            
        loans = query.filter(func.lower(BDCLoan.loan_type) != "equity").all()
        
        total_fv = sum((l.fair_value or 0) for l in loans)
        overall_yield = 0
        if total_fv > 0:
            overall_yield = sum((l.interest_rate or 0) * (l.fair_value or 0) for l in loans) / total_fv
            
        def _get_type_yield(lt_match):
            type_loans = [l for l in loans if (l.loan_type or "").lower().replace(" ", "_") == lt_match]
            fv = sum((l.fair_value or 0) for l in type_loans)
            if fv > 0:
                return sum((l.interest_rate or 0) * (l.fair_value or 0) for l in type_loans) / fv
            return 0.0

        first_lien_yield = _get_type_yield("first_lien")
        unitranche_yield = _get_type_yield("unitranche")
        second_lien_yield = _get_type_yield("second_lien")
        
        # Get SOFR for that quarter's end date approximation
        # We find the latest SOFR value before or at the end of the quarter
        # Since we might not have exact quarter dates, we can pick the max date for SOFR in the DB that is reasonably close
        # Or simply query the macro_indicators table for "SOFR" around that time.
        # Assuming we can grab the latest SOFR on or before the latest filing date in that quarter
        latest_filing = db.query(func.max(BDCLoan.filing_date)).filter(BDCLoan.quarter == q).scalar()
        sofr_rate = 0.0
        if latest_filing:
            sofr_record = db.query(MacroIndicator).filter(
                MacroIndicator.series_id == "sofr",
                MacroIndicator.date <= latest_filing
            ).order_by(desc(MacroIndicator.date)).first()
            if sofr_record:
                sofr_rate = sofr_record.value
                
        # If rate is given as a decimal (e.g. 0.05 for 5%), and overall_yield is also decimal
        # SOFR in FRED is usually given as percent (e.g., 5.3). If yield is decimal, we need to align them.
        # Let's assume yields and sofr are both in the same scale (e.g. decimals, 0.08 for 8%).
        # We will assume SOFR is percent if > 1, so divide by 100 if needed.
        if sofr_rate > 1.0 and overall_yield < 1.0:
            sofr_rate = sofr_rate / 100.0

        implied_spread_over_sofr = overall_yield - sofr_rate

        results.append({
            "quarter": q,
            "overall_yield": overall_yield,
            "first_lien_yield": first_lien_yield,
            "unitranche_yield": unitranche_yield,
            "second_lien_yield": second_lien_yield,
            "loan_count": len(loans),
            "sofr_rate": sofr_rate,
            "implied_spread_over_sofr": implied_spread_over_sofr
        })
        
    return results

def get_spread_compression_analysis(db: Session) -> dict:
    distinct_quarters = [q[0] for q in db.query(BDCLoan.quarter).distinct().order_by(desc(BDCLoan.quarter)).all()]
    if not distinct_quarters:
        return {}

    current_q = distinct_quarters[0]
    q_1yr_ago = distinct_quarters[4] if len(distinct_quarters) > 4 else None
    q_2yr_ago = distinct_quarters[8] if len(distinct_quarters) > 8 else None

    def _get_yields_by_type(q):
        if not q:
            return {}
        loans = db.query(BDCLoan).filter(BDCLoan.quarter == q, func.lower(BDCLoan.loan_type) != "equity").all()
        by_type = {}
        # Group by normalized loan type
        for l in loans:
            lt = (l.loan_type or "other").lower().replace(" ", "_")
            if lt not in by_type:
                by_type[lt] = {"fv": 0, "weighted_yield_num": 0}
            fv = l.fair_value or 0
            by_type[lt]["fv"] += fv
            by_type[lt]["weighted_yield_num"] += (l.interest_rate or 0) * fv
            
        result = {}
        for lt, data in by_type.items():
            if data["fv"] > 0:
                result[lt] = data["weighted_yield_num"] / data["fv"]
        return result

    current_yields = _get_yields_by_type(current_q)
    yields_1yr = _get_yields_by_type(q_1yr_ago)
    yields_2yr = _get_yields_by_type(q_2yr_ago)

    analysis = []
    loan_types = ["first_lien", "unitranche", "second_lien", "mezzanine"]
    
    first_lien_change_bps = 0

    for lt in loan_types:
        cy = current_yields.get(lt, 0)
        y1 = yields_1yr.get(lt, 0)
        y2 = yields_2yr.get(lt, 0)
        
        change_1yr = (cy - y1) * 10000 if cy and y1 else 0 # assuming yields are decimals (e.g. 0.08)
        change_2yr = (cy - y2) * 10000 if cy and y2 else 0
        
        if lt == "first_lien":
            first_lien_change_bps = change_1yr

        trend = "stable"
        if change_1yr < -15:
            trend = "compressing"
        elif change_1yr > 15:
            trend = "widening"
            
        analysis.append({
            "loan_type": lt,
            "current_yield": cy,
            "yield_1yr_ago": y1,
            "yield_2yr_ago": y2,
            "change_1yr_bps": change_1yr,
            "change_2yr_bps": change_2yr,
            "trend": trend
        })

    narrative = f"First lien spreads have "
    if first_lien_change_bps < -15:
        narrative += f"compressed {abs(int(first_lien_change_bps))}bps over the past year."
    elif first_lien_change_bps > 15:
        narrative += f"widened {abs(int(first_lien_change_bps))}bps over the past year."
    else:
        narrative += "remained relatively stable over the past year."

    return {
        "analysis": analysis,
        "narrative": narrative,
        "quarters_compared": {
            "current": current_q,
            "1yr_ago": q_1yr_ago,
            "2yr_ago": q_2yr_ago
        }
    }

def get_industry_yield_heatmap(db: Session, quarter: str = None) -> List[Dict]:
    if not quarter:
        quarter = _get_latest_quarter(db)
        if not quarter:
            return []

    loans = db.query(BDCLoan).filter(BDCLoan.quarter == quarter, func.lower(BDCLoan.loan_type) != "equity").all()
    total_fv = sum((l.fair_value or 0) for l in loans)
    
    if total_fv == 0:
        return []

    industry_data = {}
    for l in loans:
        ind = l.industry or "Unknown"
        if ind not in industry_data:
            industry_data[ind] = {
                "fv": 0,
                "weighted_yield_num": 0,
                "loan_count": 0,
                "fair_to_par_num": 0,
                "par_total": 0
            }
            
        fv = l.fair_value or 0
        par = l.par_value or 0
        industry_data[ind]["fv"] += fv
        industry_data[ind]["weighted_yield_num"] += (l.interest_rate or 0) * fv
        industry_data[ind]["loan_count"] += 1
        
        # for avg_fair_to_par
        if par > 0 and fv > 0:
            industry_data[ind]["fair_to_par_num"] += (fv / par) * fv # weighted by fv
            industry_data[ind]["par_total"] += fv

    results = []
    for ind, data in industry_data.items():
        if data["fv"] > 0:
            w_yield = data["weighted_yield_num"] / data["fv"]
            avg_ftp = data["fair_to_par_num"] / data["par_total"] if data["par_total"] > 0 else 1.0
            results.append({
                "industry_name": ind,
                "weighted_yield": w_yield,
                "portfolio_weight_pct": (data["fv"] / total_fv) * 100,
                "loan_count": data["loan_count"],
                "avg_fair_to_par": avg_ftp
            })

    results.sort(key=lambda x: x["portfolio_weight_pct"], reverse=True)
    return results[:20]

def get_sofr_spread_curve(db: Session) -> List[Dict]:
    quarter = _get_latest_quarter(db)
    if not quarter:
        return []

    loans = db.query(BDCLoan).filter(
        BDCLoan.quarter == quarter,
        BDCLoan.sofr_spread.isnot(None)
    ).all()

    buckets = {
        "short (< 2yr)": {"spread_num": 0, "fv_total": 0, "count": 0},
        "medium (2-4yr)": {"spread_num": 0, "fv_total": 0, "count": 0},
        "long (> 4yr)": {"spread_num": 0, "fv_total": 0, "count": 0}
    }

    latest_filing = db.query(func.max(BDCLoan.filing_date)).filter(BDCLoan.quarter == quarter).scalar()
    current_date = latest_filing or date.today()

    for l in loans:
        if not l.maturity_date or not l.fair_value or l.fair_value <= 0:
            continue
            
        days_to_maturity = (l.maturity_date - current_date).days
        years_to_maturity = days_to_maturity / 365.25
        
        if years_to_maturity < 0:
            continue # already matured
            
        if years_to_maturity < 2:
            bucket_key = "short (< 2yr)"
        elif years_to_maturity <= 4:
            bucket_key = "medium (2-4yr)"
        else:
            bucket_key = "long (> 4yr)"
            
        # Extract SOFR spread if available. We filtered by isnot(None), but check anyway
        spread = l.sofr_spread or 0
        # Check if spread is in bps or decimal. E.g. 500 or 0.05.
        # Assuming it's decimal or bps, let's normalize to bps if we want spread curve in bps.
        # Usually spread > 1 is bps, < 1 is decimal.
        if spread < 1.0:
            spread_bps = spread * 10000
        else:
            spread_bps = spread
            
        buckets[bucket_key]["spread_num"] += spread_bps * l.fair_value
        buckets[bucket_key]["fv_total"] += l.fair_value
        buckets[bucket_key]["count"] += 1

    results = []
    # Maintain explicit order
    for label in ["short (< 2yr)", "medium (2-4yr)", "long (> 4yr)"]:
        data = buckets[label]
        avg_spread = data["spread_num"] / data["fv_total"] if data["fv_total"] > 0 else 0
        results.append({
            "tenor_label": label,
            "avg_spread_bps": avg_spread,
            "loan_count": data["count"]
        })

    return results
