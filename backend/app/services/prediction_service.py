import os
import pickle
import logging
from typing import List, Dict, Any, Tuple
from datetime import datetime
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import desc

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score
import shap

from app.models.database import BDCSummary, BDCLoan, MacroIndicator, NLPSentiment

logger = logging.getLogger(__name__)

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "stress_model.pkl")

os.makedirs(MODEL_DIR, exist_ok=True)

FEATURE_COLUMNS = [
    'non_accrual_rate_change',
    'nav_premium_discount',
    'fair_to_par_below_90_pct',
    'yield_vs_universe',
    'leverage_ratio',
    'first_lien_pct',
    'net_deployment',
    'hy_spread_change',
    'yield_curve',
    'nlp_sentiment_score'
]

def _build_features_df(db: Session) -> pd.DataFrame:
    summaries = db.query(BDCSummary).all()
    loans = db.query(BDCLoan).all()
    macros = db.query(MacroIndicator).all()
    sentiments = db.query(NLPSentiment).all()

    summary_df = pd.DataFrame([s.__dict__ for s in summaries]).drop(columns=['_sa_instance_state'], errors='ignore')
    if summary_df.empty:
        return pd.DataFrame()
        
    loan_df = pd.DataFrame([l.__dict__ for l in loans]).drop(columns=['_sa_instance_state'], errors='ignore')
    macro_df = pd.DataFrame([m.__dict__ for m in macros]).drop(columns=['_sa_instance_state'], errors='ignore')
    sentiment_df = pd.DataFrame([s.__dict__ for s in sentiments]).drop(columns=['_sa_instance_state'], errors='ignore')

    summary_df = summary_df.sort_values(by=['bdc_ticker', 'quarter']).reset_index(drop=True)

    # 1. non_accrual_rate_change
    summary_df['prev_non_accrual'] = summary_df.groupby('bdc_ticker')['non_accrual_rate_pct'].shift(1)
    summary_df['non_accrual_rate_change'] = summary_df['non_accrual_rate_pct'] - summary_df['prev_non_accrual']

    # Target
    summary_df['next_non_accrual_change'] = summary_df.groupby('bdc_ticker')['non_accrual_rate_change'].shift(-1)
    summary_df['target_increase_gt_0_5'] = (summary_df['next_non_accrual_change'] > 0.5).astype(int)

    # 2. nav_premium_discount
    summary_df['nav_premium_discount'] = summary_df['nav_premium_discount_pct']

    # 3. fair_to_par_below_90_pct
    fair_to_par_below_90_pct = []
    if not loan_df.empty:
        for (ticker, q), group in loan_df.groupby(['bdc_ticker', 'quarter']):
            total_fv = group['fair_value'].sum()
            if total_fv > 0:
                below_90_fv = group[group['fair_to_par_ratio'] < 0.9]['fair_value'].sum()
                pct = (below_90_fv / total_fv) * 100
            else:
                pct = 0.0
            fair_to_par_below_90_pct.append({'bdc_ticker': ticker, 'quarter': q, 'fair_to_par_below_90_pct': pct})
    ftp_df = pd.DataFrame(fair_to_par_below_90_pct)
    if not ftp_df.empty:
        summary_df = pd.merge(summary_df, ftp_df, on=['bdc_ticker', 'quarter'], how='left')
    else:
        summary_df['fair_to_par_below_90_pct'] = 0.0

    # 4. yield_vs_universe
    universe_yield = summary_df.groupby('quarter')['weighted_avg_yield'].mean().rename('universe_yield')
    summary_df = summary_df.join(universe_yield, on='quarter')
    summary_df['yield_vs_universe'] = summary_df['weighted_avg_yield'] - summary_df['universe_yield']

    # 5. leverage_ratio
    summary_df['leverage_ratio'] = summary_df['debt_to_equity']

    # 6. first_lien_pct
    summary_df['first_lien_pct'] = summary_df['first_lien_pct']

    # 7. net_deployment
    summary_df['net_deployment'] = summary_df['net_new_deployment']

    # 10. nlp_sentiment_score
    if not sentiment_df.empty:
        summary_df = pd.merge(summary_df, sentiment_df[['bdc_ticker', 'quarter', 'net_sentiment_score']], on=['bdc_ticker', 'quarter'], how='left')
        summary_df.rename(columns={'net_sentiment_score': 'nlp_sentiment_score'}, inplace=True)
    else:
        summary_df['nlp_sentiment_score'] = 0.0

    summary_df['hy_spread_change'] = 0.0
    summary_df['yield_curve'] = 0.0
    
    if not macro_df.empty and 'filing_date' in summary_df.columns:
        macro_df['date'] = pd.to_datetime(macro_df['date'])
        summary_df['filing_date'] = pd.to_datetime(summary_df['filing_date'])
        macro_df = macro_df.sort_values('date')
        
        for idx, row in summary_df.iterrows():
            f_date = row['filing_date']
            if pd.isnull(f_date):
                continue
                
            hy_records = macro_df[(macro_df['series_id'] == 'BAMLH0A0HYM2') & (macro_df['date'] <= f_date)]
            if not hy_records.empty:
                current_hy = hy_records.iloc[-1]['value']
                prev_hy_records = hy_records[hy_records['date'] <= (f_date - pd.Timedelta(days=90))]
                if not prev_hy_records.empty:
                    prev_hy = prev_hy_records.iloc[-1]['value']
                    summary_df.at[idx, 'hy_spread_change'] = current_hy - prev_hy
                    
            yc_records = macro_df[(macro_df['series_id'] == 'T10Y2Y') & (macro_df['date'] <= f_date)]
            if not yc_records.empty:
                summary_df.at[idx, 'yield_curve'] = yc_records.iloc[-1]['value']

    summary_df[FEATURE_COLUMNS] = summary_df[FEATURE_COLUMNS].fillna(0.0)
    return summary_df

def train_model(db: Session) -> Dict[str, Any]:
    """Train the random forest model."""
    df = _build_features_df(db)
    if df.empty:
        return {"status": "error", "message": "No data available"}
        
    distinct_quarters = df['quarter'].nunique()
    if distinct_quarters < 6:
        return {
            "status": "warning", 
            "message": f"Insufficient historical quarters ({distinct_quarters}). Minimum 6 required."
        }

    # Drop the latest quarter because we don't have the target for it yet
    train_df = df.dropna(subset=['next_non_accrual_change'])
    
    if len(train_df) < 10:
        return {"status": "error", "message": "Not enough training samples after dropping missing targets."}

    X = train_df[FEATURE_COLUMNS]
    y = train_df['target_increase_gt_0_5']

    model = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
    
    # 5-fold CV
    cv_scores = cross_val_score(model, X, y, cv=5, scoring='roc_auc')
    auc_score = cv_scores.mean()

    model.fit(X, y)

    # Save model
    with open(MODEL_PATH, "wb") as f:
        pickle.dump({
            "model": model,
            "auc": auc_score,
            "trained_at": datetime.now().isoformat(),
            "n_quarters": distinct_quarters,
            "n_bdcs": df['bdc_ticker'].nunique(),
            "warning": auc_score < 0.65
        }, f)

    return {
        "status": "success",
        "auc": auc_score,
        "cv_scores": cv_scores.tolist(),
        "warning": auc_score < 0.65
    }

def get_stress_signals(db: Session) -> Dict[str, Any]:
    if not os.path.exists(MODEL_PATH):
        return {"error": "Model not trained yet."}
        
    with open(MODEL_PATH, "rb") as f:
        model_data = pickle.load(f)
        
    model = model_data["model"]
    auc = model_data["auc"]
    n_quarters = model_data["n_quarters"]
    n_bdcs = model_data["n_bdcs"]
    is_warning = model_data["warning"]

    df = _build_features_df(db)
    if df.empty:
        return {"error": "No data available."}

    # Get only the latest quarter for predictions
    latest_quarter = df['quarter'].max()
    latest_df = df[df['quarter'] == latest_quarter].copy()
    
    if latest_df.empty:
        return {"error": "No data for latest quarter."}

    X_latest = latest_df[FEATURE_COLUMNS]
    
    # Probabilities
    probs = model.predict_proba(X_latest)[:, 1]
    latest_df['stress_probability'] = probs
    
    # SHAP values for top risk drivers
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_latest)
    # SHAP returns a list of arrays for classification (one per class). Class 1 is index 1.
    if isinstance(shap_values, list):
        shap_vals_class1 = shap_values[1]
    else:
        # In some SHAP versions/models it might be 3D array or just 2D depending on setup
        if len(shap_values.shape) == 3:
            shap_vals_class1 = shap_values[:, :, 1]
        else:
            shap_vals_class1 = shap_values

    results = []
    
    for i, row in latest_df.iterrows():
        prob = row['stress_probability']
        
        if prob < 0.3:
            tier = "low"
        elif prob <= 0.6:
            tier = "elevated"
        else:
            tier = "high"
            
        # Get top 3 features pushing risk up
        # We look at the feature indices with the highest positive SHAP values
        sv = shap_vals_class1[latest_df.index.get_loc(i)]
        
        # Sort indices by descending SHAP value
        top_indices = np.argsort(-sv)[:3]
        top_drivers = []
        for idx in top_indices:
            if sv[idx] > 0: # Only include if it actually pushes risk up
                top_drivers.append({
                    "feature": FEATURE_COLUMNS[idx],
                    "contribution": float(sv[idx]),
                    "value": float(row[FEATURE_COLUMNS[idx]])
                })
        
        results.append({
            "bdc_ticker": row['bdc_ticker'],
            "bdc_name": row.get('bdc_name', row['bdc_ticker']),
            "quarter": latest_quarter,
            "stress_probability": float(prob),
            "stress_tier": tier,
            "top_3_risk_drivers": top_drivers
        })
        
    warning_text = ""
    if is_warning:
        warning_text = "Insufficient data for reliable prediction — use as directional signal only. "
        
    confidence_note = f"{warning_text}Based on {n_quarters} historical quarters of data from {n_bdcs} BDCs. This is a pattern-based indicator using limited public data. For research purposes only."
    
    return {
        "signals": results,
        "metadata": {
            "model_auc": float(auc),
            "confidence_note": confidence_note,
            "latest_quarter": latest_quarter
        }
    }
