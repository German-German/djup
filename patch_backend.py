import re

# 1. Add get_yield_by_bdc to yield_analytics.py
with open('backend/app/services/yield_analytics.py', 'r') as f:
    ya_content = f.read()

get_by_bdc = """
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

def get_yield_time_series
"""
ya_content = ya_content.replace('def get_yield_time_series', get_by_bdc.strip())

with open('backend/app/services/yield_analytics.py', 'w') as f:
    f.write(ya_content)


# 2. Add route to yields.py
with open('backend/app/api/yields.py', 'r') as f:
    yp_content = f.read()

by_bdc_route = """
@router.get("/by-bdc")
def get_yield_by_bdc_route(quarter: Optional[str] = None, db: Session = Depends(get_db)):
    \"\"\"Returns overall weighted yield per BDC for the selected quarter.\"\"\"
    return yield_analytics.get_yield_by_bdc(db, quarter)

@router.get("/overview", response_model=YieldOverviewResponse)
"""
yp_content = yp_content.replace('@router.get("/overview", response_model=YieldOverviewResponse)', by_bdc_route.strip())

with open('backend/app/api/yields.py', 'w') as f:
    f.write(yp_content)


# 3. Remove hy_spread regressor from yield_forecast_service.py to fix extreme projections
with open('backend/app/services/yield_forecast_service.py', 'r') as f:
    yf_content = f.read()

yf_content = yf_content.replace("m.add_regressor('hy_spread')", "# m.add_regressor('hy_spread')")

with open('backend/app/services/yield_forecast_service.py', 'w') as f:
    f.write(yf_content)

print("Patch applied.")
