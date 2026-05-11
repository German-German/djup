from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import commentary_service
from app.api.admin import verify_api_key

router = APIRouter(prefix="/api/commentary", tags=["commentary"])

@router.get("/latest")
def get_latest_commentary(db: Session = Depends(get_db)):
    """
    Returns the latest AI-generated market commentary.
    """
    try:
        return commentary_service.generate_commentary(db, force_regenerate=False)
    except Exception as e:
        import traceback
        commentary_service.logger.error(f"Error getting commentary: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/regenerate", dependencies=[Depends(verify_api_key)])
def regenerate_commentary(db: Session = Depends(get_db)):
    """
    Manually trigger regeneration of the market commentary (admin only).
    """
    try:
        return commentary_service.generate_commentary(db, force_regenerate=True)
    except Exception as e:
        import traceback
        commentary_service.logger.error(f"Error regenerating commentary: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
