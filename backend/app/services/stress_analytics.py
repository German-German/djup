import logging
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.models.database import BDCLoan, BDCSummary

logger = logging.getLogger(__name__)

def _get_latest_quarter(db: Session) -> str:
    result = db.query(BDCLoan.quarter).order_by(desc(BDCLoan.quarter)).first()
    return result[0] if result and result[0] else None

def get_non_accrual_trends(db: Session, quarters: int = 8) -> List[Dict]:
    distinct_quarters = db.query(BDCSummary.quarter).distinct().order_by(desc(BDCSummary.quarter)).limit(quarters).all()
    recent_quarters = [q[0] for q in distinct_quarters if q[0]]
    recent_quarters.sort()

    results = []
    for q in recent_quarters:
        summaries = db.query(BDCSummary).filter(BDCSummary.quarter == q).all()
        if not summaries:
            continue
            
        by_bdc = {}
        total_fv = 0.0
        total_non_accrual_fv = 0.0
        
        for s in summaries:
            ticker = s.bdc_ticker
            rate = s.non_accrual_rate_pct or 0.0
            fv = s.total_portfolio_fair_value or 0.0
            
            by_bdc[ticker] = rate
            total_fv += fv
            total_non_accrual_fv += (rate / 100.0) * fv
            
        universe_rate = (total_non_accrual_fv / total_fv * 100.0) if total_fv > 0 else 0.0
        
        results.append({
            "quarter": q,
            "universe_rate": universe_rate,
            "by_bdc": by_bdc
        })
        
    return results

def get_stress_dashboard(db: Session) -> Dict:
    quarter = _get_latest_quarter(db)
    if not quarter:
        return {}

    summaries = db.query(BDCSummary).filter(BDCSummary.quarter == quarter).all()
    
    total_fv = 0.0
    total_non_accrual_fv = 0.0
    bdc_count_above_3pct = 0
    nav_discount_count = 0
    
    worst_bdc = {"ticker": None, "non_accrual_rate": -1}
    best_bdc = {"ticker": None, "non_accrual_rate": 101}

    for s in summaries:
        rate = s.non_accrual_rate_pct or 0.0
        fv = s.total_portfolio_fair_value or 0.0
        nav_discount = s.nav_premium_discount_pct or 0.0
        
        total_fv += fv
        total_non_accrual_fv += (rate / 100.0) * fv
        
        if rate > 3.0:
            bdc_count_above_3pct += 1
            
        if nav_discount < 0:
            nav_discount_count += 1
            
        if rate > worst_bdc["non_accrual_rate"]:
            worst_bdc = {"ticker": s.bdc_ticker, "non_accrual_rate": rate}
            
        if rate < best_bdc["non_accrual_rate"]:
            best_bdc = {"ticker": s.bdc_ticker, "non_accrual_rate": rate}

    universe_non_accrual_rate = (total_non_accrual_fv / total_fv * 100.0) if total_fv > 0 else 0.0

    # Distressed loans
    loans = db.query(BDCLoan).filter(BDCLoan.quarter == quarter).all()
    distressed_count = 0
    distressed_fv = 0.0
    
    for l in loans:
        fv = l.fair_value or 0.0
        par = l.par_value or 0.0
        if par > 0 and fv < 0.90 * par:
            distressed_count += 1
            distressed_fv += fv

    return {
        "quarter": quarter,
        "universe_non_accrual_rate": universe_non_accrual_rate,
        "bdc_count_above_3pct": bdc_count_above_3pct,
        "nav_discount_count": nav_discount_count,
        "worst_bdc": worst_bdc if worst_bdc["ticker"] else None,
        "best_bdc": best_bdc if best_bdc["ticker"] else None,
        "fair_to_par_below_90": distressed_count,
        "total_distressed_fair_value_mm": distressed_fv / 1e6
    }

def get_watchlist_borrowers(db: Session, min_bdc_appearances: int = 2) -> List[Dict]:
    quarter = _get_latest_quarter(db)
    if not quarter:
        return []

    loans = db.query(BDCLoan).filter(
        BDCLoan.quarter == quarter, 
        BDCLoan.borrower_name.isnot(None),
        func.lower(BDCLoan.loan_type) != "equity"
    ).all()
    
    borrower_map = {}
    for l in loans:
        name = l.borrower_name.strip().lower()
        if name not in borrower_map:
            borrower_map[name] = {
                "display_name": l.borrower_name.strip(),
                "tickers": set(),
                "total_fv": 0.0,
                "total_par": 0.0,
                "is_non_accrual_any": False,
                "industry_counts": {}
            }
            
        b_data = borrower_map[name]
        b_data["tickers"].add(l.bdc_ticker)
        fv = l.fair_value or 0.0
        par = l.par_value or 0.0
        
        b_data["total_fv"] += fv
        b_data["total_par"] += par
        
        if l.is_non_accrual:
            b_data["is_non_accrual_any"] = True
            
        ind = l.industry or "Unknown"
        b_data["industry_counts"][ind] = b_data["industry_counts"].get(ind, 0) + 1

    watchlist = []
    for name, b_data in borrower_map.items():
        if len(b_data["tickers"]) >= min_bdc_appearances:
            avg_ftp = b_data["total_fv"] / b_data["total_par"] if b_data["total_par"] > 0 else 1.0
            
            # get most common industry
            dominant_industry = "Unknown"
            if b_data["industry_counts"]:
                dominant_industry = max(b_data["industry_counts"].items(), key=lambda x: x[1])[0]
                
            watchlist.append({
                "borrower_name": b_data["display_name"],
                "bdc_count": len(b_data["tickers"]),
                "bdc_list": list(b_data["tickers"]),
                "total_fair_value_mm": b_data["total_fv"] / 1e6,
                "avg_fair_to_par": avg_ftp,
                "is_non_accrual_any": b_data["is_non_accrual_any"],
                "industry": dominant_industry
            })

    # Sort by is_non_accrual_any DESC, then avg_fair_to_par ASC
    watchlist.sort(key=lambda x: (not x["is_non_accrual_any"], x["avg_fair_to_par"]))
    return watchlist

def get_nav_premium_history(db: Session) -> List[Dict]:
    distinct_quarters = db.query(BDCSummary.quarter).distinct().order_by(BDCSummary.quarter).all()
    quarters = [q[0] for q in distinct_quarters if q[0]]
    
    results = []
    for q in quarters:
        summaries = db.query(BDCSummary).filter(BDCSummary.quarter == q).all()
        if not summaries:
            continue
            
        by_bdc = {}
        total_discount = 0.0
        count = 0
        
        for s in summaries:
            discount = s.nav_premium_discount_pct
            if discount is not None:
                by_bdc[s.bdc_ticker] = discount
                total_discount += discount
                count += 1
                
        universe_avg = (total_discount / count) if count > 0 else 0.0
        
        results.append({
            "quarter": q,
            "universe_avg_premium_discount": universe_avg,
            "by_bdc": by_bdc
        })
        
    return results

def get_fair_value_distribution(db: Session, quarter: str = None) -> Dict:
    if not quarter:
        quarter = _get_latest_quarter(db)
        if not quarter:
            return {}

    loans = db.query(BDCLoan).filter(BDCLoan.quarter == quarter, func.lower(BDCLoan.loan_type) != "equity").all()
    
    buckets = {
        "par (0.98-1.02)": {"count": 0, "fair_value": 0.0},
        "slight_discount (0.90-0.98)": {"count": 0, "fair_value": 0.0},
        "distressed (0.75-0.90)": {"count": 0, "fair_value": 0.0},
        "deep_distressed (<0.75)": {"count": 0, "fair_value": 0.0},
        "premium (>1.02)": {"count": 0, "fair_value": 0.0} # Added premium to catch anything above 1.02
    }
    
    for l in loans:
        fv = l.fair_value or 0.0
        par = l.par_value or 0.0
        
        if par <= 0:
            continue # Can't calculate ratio
            
        ratio = fv / par
        
        if ratio > 1.02:
            key = "premium (>1.02)"
        elif ratio >= 0.98:
            key = "par (0.98-1.02)"
        elif ratio >= 0.90:
            key = "slight_discount (0.90-0.98)"
        elif ratio >= 0.75:
            key = "distressed (0.75-0.90)"
        else:
            key = "deep_distressed (<0.75)"
            
        buckets[key]["count"] += 1
        buckets[key]["fair_value"] += fv
        
    return buckets
