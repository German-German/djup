import sys
import os

# Add the backend directory to sys.path so we can import from app
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import SessionLocal
from app.models.database import BDCCompany

BDC_LIST = [
    {"ticker": "ARCC", "name": "Ares Capital Corporation", "cik": "0001278752"},
    {"ticker": "OBDC", "name": "Blue Owl Capital Corporation", "cik": "0001655888"},
    {"ticker": "GBDC", "name": "Golub Capital BDC", "cik": "0001476765"},
    {"ticker": "HTGC", "name": "Hercules Capital", "cik": "0001370755"},
    {"ticker": "PSEC", "name": "Prospect Capital Corporation", "cik": "0001287286"},
    {"ticker": "FSK", "name": "FS KKR Capital Corp", "cik": "0001655050"},
    {"ticker": "NMFC", "name": "New Mountain Finance", "cik": "0001496099"},
    {"ticker": "TCPC", "name": "TCP Capital Corp", "cik": "0001452936"},
    {"ticker": "CSWC", "name": "Capital Southwest", "cik": "0001321741"},
    {"ticker": "BBDC", "name": "Barings BDC", "cik": "0001655050"},
    {"ticker": "WHF", "name": "WhiteHorse Finance", "cik": "0001552198"},
    {"ticker": "GAIN", "name": "Gladstone Investment", "cik": "0001273931"},
    {"ticker": "HRZN", "name": "Horizon Technology Finance", "cik": "0001478454"},
    {"ticker": "SAR", "name": "Saratoga Investment Corp", "cik": "0001377936"},
    {"ticker": "LRFC", "name": "Logan Ridge Financial", "cik": "0001376227"},
]

def seed_bdcs():
    db = SessionLocal()
    try:
        count = 0
        for bdc in BDC_LIST:
            # Check if exists
            existing = db.query(BDCCompany).filter(BDCCompany.ticker == bdc["ticker"]).first()
            if not existing:
                new_bdc = BDCCompany(**bdc)
                db.add(new_bdc)
                count += 1
        
        if count > 0:
            db.commit()
            print(f"Successfully seeded {count} BDCs.")
        else:
            print("All BDCs are already seeded.")
            
    except Exception as e:
        print(f"Error seeding BDCs: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Starting BDC seeding process...")
    seed_bdcs()
    print("Done.")
