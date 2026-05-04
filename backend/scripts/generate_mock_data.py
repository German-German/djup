import sys
import os
from datetime import datetime, timedelta
import random

# Add the backend directory to sys.path
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import SessionLocal, Base, engine
from app.models.database import BDCCompany, BDCLoan, BDCSummary, MacroIndicator, FilingRegistry

def generate_mock_data():
    db = SessionLocal()
    try:
        # 1. Create tables
        Base.metadata.create_all(bind=engine)
        
        # 2. Seed BDCs if not present
        bdcs = [
            {"ticker": "ARCC", "name": "Ares Capital Corporation", "cik": "0001278752"},
            {"ticker": "OBDC", "name": "Blue Owl Capital Corporation", "cik": "0001655888"},
            {"ticker": "GBDC", "name": "Golub Capital BDC", "cik": "0001476765"},
            {"ticker": "HTGC", "name": "Hercules Capital", "cik": "0001370755"},
        ]
        
        for b in bdcs:
            if not db.query(BDCCompany).filter_by(ticker=b["ticker"]).first():
                db.add(BDCCompany(**b))
        
        db.commit()
        
        # 3. Generate Summaries & Loans for 4 quarters
        quarters = ["Q4_23", "Q1_24", "Q2_24", "Q3_24"]
        industries = ["Software", "Healthcare", "Financial Services", "Energy", "Consumer Goods"]
        
        for q in quarters:
            # Estimate filing date
            year = 2024 if "24" in q else 2023
            month = 2 if "Q4" in q else (5 if "Q1" in q else (8 if "Q2" in q else 11))
            f_date = datetime(year, month, 15).date()
            
            for b in bdcs:
                # Summary
                total_fv = random.uniform(5000, 15000) * 1e6
                summary = BDCSummary(
                    bdc_ticker=b["ticker"],
                    quarter=q,
                    filing_date=f_date,
                    total_portfolio_fair_value=total_fv,
                    net_investment_income_per_share=random.uniform(0.4, 0.6),
                    nav_per_share=random.uniform(14, 16),
                    nav_premium_discount_pct=random.uniform(-15, 5),
                    non_accrual_rate_pct=random.uniform(0.5, 3.5),
                    weighted_avg_yield=random.uniform(0.10, 0.13) # Stored as decimal in model
                )
                db.add(summary)
                
                # Create 20 loans per BDC per quarter
                for i in range(20):
                    par = random.uniform(10, 100) * 1e6
                    fv = par * random.uniform(0.85, 1.05)
                    loan = BDCLoan(
                        bdc_ticker=b["ticker"],
                        borrower_name=f"Borrower {random.randint(1, 50)}",
                        industry=random.choice(industries),
                        loan_type=random.choice(["First Lien", "Second Lien", "Unitranche"]),
                        par_value=par,
                        fair_value=fv,
                        interest_rate=random.uniform(8, 14),
                        maturity_date=datetime(2027, 12, 31).date(),
                        quarter=q,
                        filing_date=f_date,
                        is_non_accrual=(random.random() < 0.05)
                    )
                    db.add(loan)
            
            db.commit()

        # 4. Macro Indicators
        macro_series = ["hy_spread", "sofr", "yield_curve", "ig_spread"]
        start_date = datetime(2023, 10, 1)
        for i in range(400):
            curr_date = start_date + timedelta(days=i)
            for s in macro_series:
                val = 0
                if s == "hy_spread": val = random.uniform(350, 500)
                elif s == "sofr": val = random.uniform(5.0, 5.5)
                elif s == "yield_curve": val = random.uniform(-0.5, 0.2)
                elif s == "ig_spread": val = random.uniform(120, 180)
                
                ind = MacroIndicator(
                    date=curr_date.date(),
                    series_id=s,
                    series_name=s,
                    value=val
                )
                db.add(ind)
            
            if i % 50 == 0:
                db.commit()
        
        db.commit()
        print("Mock data generated successfully!")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    generate_mock_data()
