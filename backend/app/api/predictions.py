from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import prediction_service

router = APIRouter(prefix="/api/predictions", tags=["predictions"])

@router.get("/stress-signals")
def get_stress_signals(db: Session = Depends(get_db)):
    """
    Returns BDCs with their stress tier and risk drivers.
    This model predicts which BDCs are at elevated risk of rising non-accruals in the NEXT quarter.
    """
    try:
        # Check if model exists, if not, try to train it
        if not __import__('os').path.exists(prediction_service.MODEL_PATH):
            train_result = prediction_service.train_model(db)
            if train_result.get("status") == "error":
                raise HTTPException(status_code=500, detail=f"Failed to train model: {train_result.get('message')}")
        
        result = prediction_service.get_stress_signals(db)
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        return result
    except Exception as e:
        import traceback
        prediction_service.logger.error(f"Error generating stress signals: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/train-stress-model")
def train_stress_model(db: Session = Depends(get_db)):
    """
    Manually trigger retraining of the stress prediction model.
    """
    try:
        result = prediction_service.train_model(db)
        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("message"))
        return result
    except Exception as e:
        import traceback
        prediction_service.logger.error(f"Error training stress model: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
