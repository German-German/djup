import logging
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.database import BDCSummary, BDCLoan

logger = logging.getLogger(__name__)

def build_manager_comparison_matrix(db: Session, quarter: str = None) -> list[dict]:
    if not quarter:
        latest = db.query(BDCSummary.quarter).order_by(desc(BDCSummary.quarter)).first()
        if not latest:
            return []
        quarter = latest[0]

    summaries = db.query(BDCSummary).filter(BDCSummary.quarter == quarter).all()
    
    results = []
    for s in summaries:
        nav_pct = float(s.nav_premium_discount_pct) if s.nav_premium_discount_pct is not None else 0.0
        first_lien = float(s.first_lien_pct) if s.first_lien_pct is not None else 0.0
        non_accrual = float(s.non_accrual_rate_pct) if s.non_accrual_rate_pct is not None else 0.0
        yield_pct = float(s.weighted_avg_yield) if s.weighted_avg_yield is not None else 0.0
        
        # Calculate risk adjusted yield ratio
        yield_risk_ratio = yield_pct / (non_accrual + 1.0)
        
        # Determine risk tier
        if first_lien > 85.0 and non_accrual < 1.5:
            risk_tier = "Conservative"
        elif first_lien < 70.0 or non_accrual > 3.0:
            risk_tier = "Aggressive"
        else:
            risk_tier = "Balanced"
            
        results.append({
            "ticker": s.bdc_ticker,
            "bdc_name": s.bdc_name,
            "portfolio_size_bn": round(s.total_portfolio_fair_value / 1000.0, 2) if s.total_portfolio_fair_value else 0.0,
            "weighted_avg_yield": yield_pct,
            "non_accrual_rate_pct": non_accrual,
            "first_lien_pct": first_lien,
            "nav_premium_discount_pct": nav_pct,
            "debt_to_equity": float(s.debt_to_equity) if s.debt_to_equity else 0.0,
            "net_deployment_mm": float(s.net_new_deployment) if s.net_new_deployment else 0.0,
            "yield_risk_ratio": round(yield_risk_ratio, 2),
            "risk_tier": risk_tier
        })
        
    # Sort matrix by the best yield to risk ratio
    results.sort(key=lambda x: x["yield_risk_ratio"], reverse=True)
    return results

def get_bdc_deep_dive(db: Session, ticker: str) -> dict:
    # 1. Latest summary
    summary = db.query(BDCSummary).filter(BDCSummary.bdc_ticker == ticker).order_by(desc(BDCSummary.quarter)).first()
    
    # 2. Yield and Activity History (last 8 quarters)
    history = db.query(BDCSummary).filter(BDCSummary.bdc_ticker == ticker).order_by(desc(BDCSummary.quarter)).limit(8).all()
    history.reverse() # chronological order
    
    yield_history = []
    quarterly_activity = []
    for h in history:
        yield_history.append({
            "quarter": h.quarter,
            "weighted_avg_yield": float(h.weighted_avg_yield) if h.weighted_avg_yield else 0.0,
            "non_accrual_rate_pct": float(h.non_accrual_rate_pct) if h.non_accrual_rate_pct else 0.0
        })
        quarterly_activity.append({
            "quarter": h.quarter,
            "originations_mm": float(h.new_originations) if h.new_originations else 0.0,
            "repayments_mm": float(h.repayments) if h.repayments else 0.0,
            "net_deployment_mm": float(h.net_new_deployment) if h.net_new_deployment else 0.0
        })

    current_q = summary.quarter if summary else None
    top_10 = []
    ind_mix = []
    loan_mix = []
    
    # 3. Current Quarter Portfolio breakdowns
    if current_q:
        loans = db.query(BDCLoan).filter(BDCLoan.bdc_ticker == ticker, BDCLoan.quarter == current_q, BDCLoan.fair_value.isnot(None)).all()
        
        # Sort and get top 10 positions
        sorted_loans = sorted(loans, key=lambda x: x.fair_value, reverse=True)
        top_10 = [{
            "borrower": l.borrower_name,
            "industry": l.industry,
            "fair_value_mm": float(l.fair_value),
            "interest_rate": float(l.interest_rate) if l.interest_rate else None,
            "loan_type": l.loan_type
        } for l in sorted_loans[:10]]
        
        # Sector and Type breakdown
        ind_dict = {}
        loan_type_dict = {}
        total_fv = 0.0
        for l in loans:
            fv = float(l.fair_value)
            total_fv += fv
            ind = l.industry or "Unknown"
            lt = l.loan_type or "Unknown"
            
            ind_dict[ind] = ind_dict.get(ind, 0) + fv
            loan_type_dict[lt] = loan_type_dict.get(lt, 0) + fv
            
        ind_mix = [{"industry": k, "fair_value_mm": round(v, 2), "pct": round((v/total_fv)*100, 2) if total_fv else 0} for k, v in ind_dict.items()]
        ind_mix.sort(key=lambda x: x["fair_value_mm"], reverse=True)
        
        loan_mix = [{"loan_type": k, "fair_value_mm": round(v, 2), "pct": round((v/total_fv)*100, 2) if total_fv else 0} for k, v in loan_type_dict.items()]
        loan_mix.sort(key=lambda x: x["fair_value_mm"], reverse=True)

    # Format output
    summary_dict = {}
    if summary:
        summary_dict = {
            "ticker": summary.bdc_ticker,
            "name": summary.bdc_name,
            "quarter": summary.quarter,
            "nav_per_share": float(summary.nav_per_share) if summary.nav_per_share else None,
            "stock_price": float(summary.stock_price) if summary.stock_price else None,
            "nav_premium_discount_pct": float(summary.nav_premium_discount_pct) if summary.nav_premium_discount_pct else None,
            "total_portfolio_fair_value": float(summary.total_portfolio_fair_value) if summary.total_portfolio_fair_value else None,
            "non_accrual_rate_pct": float(summary.non_accrual_rate_pct) if summary.non_accrual_rate_pct else None,
            "weighted_avg_yield": float(summary.weighted_avg_yield) if summary.weighted_avg_yield else None,
        }

    return {
        "summary": summary_dict,
        "yield_history": yield_history,
        "top_10_positions": top_10,
        "industry_mix": ind_mix,
        "loan_type_mix": loan_mix,
        "quarterly_activity": quarterly_activity
    }
