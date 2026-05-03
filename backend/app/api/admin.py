import os
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import data_pipeline
from app.models.database import FilingRegistry

router = APIRouter(prefix="/api/admin", tags=["admin"])

ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "secret")

def verify_api_key(x_api_key: str = Header(None)):
    if x_api_key != ADMIN_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API Key")

@router.post("/refresh", dependencies=[Depends(verify_api_key)])
def trigger_refresh(db: Session = Depends(get_db)):
    """Triggers a full refresh of BDC and Macro data."""
    return data_pipeline.run_full_refresh(db)

@router.get("/status", dependencies=[Depends(verify_api_key)])
def get_status(db: Session = Depends(get_db)):
    """Returns filing_registry summary."""
    total_processed = db.query(FilingRegistry).filter_by(processing_status="success").count()
    failures = db.query(FilingRegistry).filter_by(processing_status="failed").all()
    
    last_update = db.query(FilingRegistry).order_by(FilingRegistry.processed_at.desc()).first()
    
    return {
        "bdcs_processed": total_processed,
        "last_update_time": last_update.processed_at if last_update else None,
        "failures": [{"bdc": f.bdc_ticker, "error": f.error_message, "time": f.processed_at} for f in failures]
    }
