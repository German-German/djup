from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import yield_forecast_service

router = APIRouter(prefix="/api/forecast", tags=["forecast"])

@router.get("/yield-trends")
def get_yield_trends(db: Session = Depends(get_db)):
    """
    Returns historical series + 2-quarter projection with confidence bands per loan type.
    Trend projection — not a forecast.
    """
    try:
        result = yield_forecast_service.get_yield_trends(db)
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        return result
    except Exception as e:
        import traceback
        yield_forecast_service.logger.error(f"Error generating yield trends: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
