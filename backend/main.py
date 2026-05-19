import logging
import os
import time
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.api import admin, predictions, forecast, commentary, external, markets, ai

from app.database import engine, Base, SessionLocal
from app.api import yields, stress, dealflow, managers, macro, sentiment
from app.models.database import RefreshLog, BDCLoan
from scheduler.quarterly_refresh import start_scheduler
from sqlalchemy import func
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# Configure basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Djup API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Configuration
ENVIRONMENT = os.getenv("ENV", "development")
if ENVIRONMENT == "production":
    allowed_origins = [os.getenv("FRONTEND_URL", "https://djup-api.vercel.app")]
else:
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Logging Middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    formatted_process_time = "{0:.2f}".format(process_time)
    logger.info(f"path={request.url.path} method={request.method} status_code={response.status_code} duration={formatted_process_time}ms")
    return response

app.include_router(yields.router, prefix="/api/yields", tags=["Yields"])
app.include_router(stress.router, prefix="/api/stress", tags=["Stress"])
app.include_router(dealflow.router, prefix="/api/dealflow", tags=["Deal Flow"])
app.include_router(managers.router, prefix="/api/managers", tags=["Managers"])
app.include_router(macro.router, prefix="/api/macro", tags=["Macro"])
app.include_router(sentiment.router, prefix="/api/sentiment", tags=["Sentiment"])
app.include_router(external.router)
app.include_router(admin.router)
app.include_router(predictions.router)
app.include_router(forecast.router)
app.include_router(commentary.router)
app.include_router(markets.router)
app.include_router(ai.router)

@app.on_event("startup")
def startup_event():
    start_scheduler()

@app.get("/api/admin/last-refresh")
def get_last_refresh():
    db = SessionLocal()
    try:
        last_log = db.query(RefreshLog).order_by(RefreshLog.started_at.desc()).first()
        total_loans = db.query(func.count(BDCLoan.id)).scalar()
        quarters = db.query(BDCLoan.quarter).distinct().all()
        quarters_list = sorted([q[0] for q in quarters if q[0]])
        
        return {
            "last_refresh_utc": last_log.completed_at.isoformat() + "Z" if last_log and last_log.completed_at else None,
            "bdcs_updated": last_log.bdcs_updated.split(",") if last_log and last_log.bdcs_updated else [],
            "bdcs_failed": last_log.bdcs_failed.split(",") if last_log and last_log.bdcs_failed else [],
            "total_loans_in_db": total_loans,
            "quarters_covered": quarters_list,
            "next_scheduled_refresh": "2024-11-21T06:00:00Z"
        }
    finally:
        db.close()

@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "version": "1.0.0", "env": ENVIRONMENT}

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global error handler caught exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error occurred", "message": str(exc)}
    )

# Serve Frontend
frontend_dist_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/dist"))

if os.path.exists(frontend_dist_path):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist_path, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def catch_all(full_path: str):
        # Exclude API routes from catch-all if needed, but since routers are registered first, 
        # FastAPI will match them first.
        file_path = os.path.join(frontend_dist_path, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist_path, "index.html"))
else:
    logger.warning(f"Frontend dist directory not found at {frontend_dist_path}. UI will not be served.")
