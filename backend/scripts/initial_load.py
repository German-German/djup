import sys
import os

# Add the backend directory to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import logging
from app.database import SessionLocal
from app.services.data_pipeline import run_full_refresh

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    logger.info("Starting initial load...")
    db = SessionLocal()
    try:
        result = run_full_refresh(db)
        logger.info(f"Initial load completed: {result}")
    except Exception as e:
        logger.error(f"Error during initial load: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
