import logging
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.models.database import BDCSummary, BDCLoan

logger = logging.getLogger(__name__)

def get_deal_flow_trends(db: Session, quarters: int = 8) -> list[dict]:
    # Fetch quarterly aggregated summary metrics across all BDCs
    summary_trends = db.query(
        BDCSummary.quarter,
        func.sum(BDCSummary.new_originations).label('total_orig_mm'),
        func.sum(BDCSummary.repayments).label('total_repay_mm'),
        func.sum(BDCSummary.net_new_deployment).label('total_net_mm'),
    ).group_by(BDCSummary.quarter).order_by(desc(BDCSummary.quarter)).limit(quarters).all()

    # Get approximate average yield from BDCLoan per quarter
    yield_trends = db.query(
        BDCLoan.quarter,
        func.avg(BDCLoan.interest_rate).label('avg_yield')
    ).group_by(BDCLoan.quarter).all()
    
    yield_map = {y.quarter: float(y.avg_yield) if y.avg_yield else 0.0 for y in yield_trends}

    # Sort by chronological order (year then quarter) instead of string-desc of "Qn_YY"
    def _chrono_key(row):
        q = row.quarter or ""
        return f"{q[-2:]}_{q[:2]}" if len(q) >= 5 else q
    sorted_trends = sorted(summary_trends, key=_chrono_key)

    results = []
    for row in sorted_trends:
        orig_raw = float(row.total_orig_mm) if row.total_orig_mm else 0.0
        repay_raw = float(row.total_repay_mm) if row.total_repay_mm else 0.0
        net_raw = float(row.total_net_mm) if row.total_net_mm else (orig_raw - repay_raw)

        # Source columns are stored as raw USD; convert to billions
        orig_bn = orig_raw / 1e9
        repay_bn = repay_raw / 1e9
        net_bn = net_raw / 1e9

        q = row.quarter
        # BDCLoan.interest_rate is stored as percent (e.g. 10.75). Frontend expects a fraction.
        avg_yield = yield_map.get(q, 0.0) / 100.0

        results.append({
            "quarter_label": q,
            "total_new_originations_bn": round(orig_bn, 2),
            "total_repayments_bn": round(repay_bn, 2),
            "net_deployment_bn": round(net_bn, 2),
            "avg_new_origination_yield": round(avg_yield, 4)
        })
    return results

def get_origination_by_sector(db: Session, quarter: str = None) -> list[dict]:
    # Group by industry for a specific quarter (or latest quarter if None)
    if not quarter:
        latest_rows = [r[0] for r in db.query(BDCLoan.quarter).distinct().all() if r[0]]
        if not latest_rows:
            return []
        quarter = max(latest_rows, key=lambda q: f"{q[-2:]}_{q[:2]}" if len(q) >= 5 else q)

    industry_stats = db.query(
        BDCLoan.industry,
        func.sum(BDCLoan.fair_value).label('total_fv'),
        func.count(BDCLoan.id).label('loan_count'),
        func.avg(BDCLoan.interest_rate).label('avg_yield')
    ).filter(BDCLoan.quarter == quarter)\
     .group_by(BDCLoan.industry)\
     .order_by(desc('total_fv')).limit(15).all()

    total_quarter_fv = db.query(func.sum(BDCLoan.fair_value)).filter(BDCLoan.quarter == quarter).scalar()
    total_quarter_fv = float(total_quarter_fv) if total_quarter_fv else 1.0

    results = []
    for row in industry_stats:
        industry = row.industry or "Unknown"
        fv_raw = float(row.total_fv) if row.total_fv else 0.0
        pct = (fv_raw / total_quarter_fv) * 100 if total_quarter_fv > 0 else 0.0

        # BDCLoan.fair_value is raw USD; convert to millions
        results.append({
            "industry": industry,
            "fair_value_mm": round(fv_raw / 1e6, 2),
            "loan_count": row.loan_count,
            "avg_yield": round(float(row.avg_yield), 2) if row.avg_yield else None,
            "pct_of_total": round(pct, 2)
        })
    return results

def get_hold_size_trends(db: Session) -> list[dict]:
    loans = db.query(BDCLoan.quarter, BDCLoan.fair_value).filter(BDCLoan.fair_value.isnot(None)).all()
    
    from collections import defaultdict
    import statistics
    
    quarter_data = defaultdict(list)
    for q, fv in loans:
        if q:
            quarter_data[q].append(float(fv))
            
    results = []
    for q in quarter_data.keys():
        fvs = quarter_data[q]
        if not fvs:
            continue
        results.append({
            "quarter": q,
            "avg_loan_size": round(statistics.mean(fvs) / 1e6, 2),
            "median_loan_size": round(statistics.median(fvs) / 1e6, 2),
            "max_loan_size": round(max(fvs) / 1e6, 2)
        })
    
    # Sort chronologically by year then quarter (e.g. Q1_23 -> 23_Q1)
    results.sort(key=lambda x: f"{x['quarter'][-2:]}_{x['quarter'][:2]}")
    return results
