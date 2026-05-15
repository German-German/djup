import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.database import BDCSummary, NLPSentiment, BDCCompany

def seed_data():
    db = SessionLocal()
    
    # 1. Seed Dealflow Summaries for the last 8 quarters
    quarters = ['Q1_23', 'Q2_23', 'Q3_23', 'Q4_23', 'Q1_24', 'Q2_24', 'Q3_24', 'Q4_24']
    bdcs = db.query(BDCCompany).all()
    
    for q in quarters:
        for bdc in bdcs:
            # Check if summary exists
            summary = db.query(BDCSummary).filter_by(bdc_ticker=bdc.ticker, quarter=q).first()
            if not summary:
                summary = BDCSummary(bdc_ticker=bdc.ticker, quarter=q)
                db.add(summary)
            
            # If originations is 0 or None, give it a realistic value (e.g. 100M - 500M)
            if not summary.new_originations or summary.new_originations == 0:
                summary.new_originations = random.uniform(100.0, 500.0) * 1000000
            
            if not summary.repayments or summary.repayments == 0:
                summary.repayments = random.uniform(50.0, 300.0) * 1000000
                
            summary.net_new_deployment = summary.new_originations - summary.repayments
            
    # 2. Seed NLP Sentiment for the last 4 quarters
    nlp_quarters = ['Q1_24', 'Q2_24', 'Q3_24', 'Q4_24']
    for q in nlp_quarters:
        for bdc in bdcs:
            existing = db.query(NLPSentiment).filter_by(bdc_ticker=bdc.ticker, quarter=q).first()
            if not existing:
                score = random.uniform(-0.4, 0.6) # realistic net sentiment range
                pos = int(random.uniform(10, 40))
                neg = int(random.uniform(5, 25))
                neu = int(random.uniform(30, 80))
                
                sentiment = NLPSentiment(
                    bdc_ticker=bdc.ticker,
                    quarter=q,
                    call_date=datetime.utcnow().date() - timedelta(days=random.randint(1, 90)),
                    net_sentiment_score=score,
                    positive_chunks=pos,
                    negative_chunks=neg,
                    neutral_chunks=neu,
                    raw_transcript_length=random.randint(15000, 30000),
                    keyword_spread_compression=random.randint(0, 5),
                    keyword_dry_powder=random.randint(0, 3),
                    keyword_deal_flow=random.randint(2, 10),
                    keyword_non_accrual=random.randint(0, 6),
                    keyword_origination=random.randint(3, 12),
                    keyword_competition=random.randint(1, 8),
                )
                db.add(sentiment)
                
    db.commit()
    db.close()
    print("Database seeding completed.")

if __name__ == "__main__":
    seed_data()
