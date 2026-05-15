import logging
from typing import List, Dict, Any
from datetime import datetime
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import func

from prophet import Prophet

from app.models.database import BDCLoan, MacroIndicator

logger = logging.getLogger(__name__)

def _get_quarter_end_date(quarter_str: str) -> datetime:
    """Convert QX_YY or YYYYQ1/2/3/4 to an approximate quarter end date."""
    if "_" in quarter_str:
        q = quarter_str.split("_")[0]
        year = 2000 + int(quarter_str.split("_")[1])
    else:
        year = int(quarter_str[:4])
        q = quarter_str[-2:]

    if q == "Q1":
        return datetime(year, 3, 31)
    elif q == "Q2":
        return datetime(year, 6, 30)
    elif q == "Q3":
        return datetime(year, 9, 30)
    elif q == "Q4":
        return datetime(year, 12, 31)
    return datetime(year, 12, 31)

def _get_next_quarter_str(quarter_str: str) -> str:
    """Gets next quarter in QX_YY or YYYYQ1 format."""
    if "_" in quarter_str:
        q_part, y_part = quarter_str.split("_")
        q = int(q_part[1])
        y = int(y_part)
        if q == 4:
            return f"Q1_{y+1}"
        else:
            return f"Q{q+1}_{y}"
    else:
        year = int(quarter_str[:4])
        q = int(quarter_str[-1])
        if q == 4:
            return f"{year+1}Q1"
        else:
            return f"{year}Q{q+1}"

def get_yield_trends(db: Session) -> Dict[str, Any]:
    # 1. Fetch historical yields by quarter and loan type
    loans = db.query(BDCLoan).filter(func.lower(BDCLoan.loan_type) != "equity").all()
    if not loans:
        return {"error": "No loan data available"}

    # Aggregate by quarter and type
    quarterly_data = {}
    for l in loans:
        q = l.quarter
        if not q:
            continue
            
        lt = (l.loan_type or "other").lower().replace(" ", "_")
        if lt not in ["first_lien", "unitranche", "second_lien"]:
            continue
            
        if q not in quarterly_data:
            quarterly_data[q] = {}
            
        if lt not in quarterly_data[q]:
            quarterly_data[q][lt] = {"fv": 0, "weighted_yield_num": 0}
            
        fv = l.fair_value or 0
        quarterly_data[q][lt]["fv"] += fv
        quarterly_data[q][lt]["weighted_yield_num"] += (l.interest_rate or 0) * fv

    # 2. Fetch FRED HY spread as external regressor
    # Assuming series_id = 'BAMLH0A0HYM2'
    macros = db.query(MacroIndicator).filter(MacroIndicator.series_id == 'BAMLH0A0HYM2').all()
    macro_df = pd.DataFrame([m.__dict__ for m in macros]).drop(columns=['_sa_instance_state'], errors='ignore')
    
    if not macro_df.empty:
        macro_df['date'] = pd.to_datetime(macro_df['date'])
        macro_df = macro_df.sort_values('date')
    
    results = {}
    
    # We need to process each loan type
    for loan_type in ["first_lien", "unitranche", "second_lien"]:
        ts_data = []
        for q, lts in quarterly_data.items():
            if loan_type in lts and lts[loan_type]["fv"] > 0:
                y = lts[loan_type]["weighted_yield_num"] / lts[loan_type]["fv"]
                dt = _get_quarter_end_date(q)
                
                # Find closest HY spread on or before the quarter end date
                hy_spread = 0.0
                if not macro_df.empty:
                    valid_macros = macro_df[macro_df['date'] <= dt]
                    if not valid_macros.empty:
                        hy_spread = valid_macros.iloc[-1]['value']
                
                ts_data.append({
                    "ds": dt,
                    "y": y,
                    "quarter": q,
                    "hy_spread": hy_spread
                })
        
        if len(ts_data) < 4:
            # Not enough data to fit prophet
            results[loan_type] = {"historical": ts_data, "forecast": [], "error": "Insufficient data"}
            continue
            
        df = pd.DataFrame(ts_data).sort_values("ds")
        
        # 3. Fit Prophet model
        m = Prophet(
            weekly_seasonality=False,
            daily_seasonality=False,
            yearly_seasonality=True,
            changepoint_prior_scale=0.1,
            interval_width=0.80 # 80% confidence interval
        )
        # m.add_regressor('hy_spread')
        
        # Catch errors if data doesn't vary enough or is too small
        try:
            m.fit(df)
            
            # Forecast 2 quarters ahead
            future_dates = []
            last_dt = df['ds'].iloc[-1]
            last_q = df['quarter'].iloc[-1]
            
            q1 = _get_next_quarter_str(last_q)
            q2 = _get_next_quarter_str(q1)
            
            dt1 = _get_quarter_end_date(q1)
            dt2 = _get_quarter_end_date(q2)
            
            future_dates.append({"ds": dt1, "quarter": q1})
            future_dates.append({"ds": dt2, "quarter": q2})
            
            future_df = pd.DataFrame(future_dates)
            
            # We need hy_spread for the future. As a naive assumption, carry forward the last known value.
            last_hy = df['hy_spread'].iloc[-1]
            future_df['hy_spread'] = last_hy
            
            forecast = m.predict(future_df)
            
            forecast_result = []
            for i, row in forecast.iterrows():
                forecast_result.append({
                    "quarter": future_df.iloc[i]["quarter"],
                    "forecast_yield": float(row["yhat"]),
                    "lower_bound": float(row["yhat_lower"]),
                    "upper_bound": float(row["yhat_upper"])
                })
                
            # Convert historical back to a clean list
            historical = df[['quarter', 'y', 'hy_spread']].rename(columns={'y': 'weighted_yield'}).to_dict(orient="records")
            
            results[loan_type] = {
                "historical": historical,
                "forecast": forecast_result
            }
        except Exception as e:
            logger.error(f"Prophet fitting failed for {loan_type}: {e}")
            results[loan_type] = {
                "historical": df[['quarter', 'y']].rename(columns={'y': 'weighted_yield'}).to_dict(orient="records"),
                "forecast": [],
                "error": "Model fitting failed"
            }
            
    return results
