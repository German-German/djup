import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.api import yields, stress, dealflow, managers, macro

# Configure basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(title="CreditLens API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(yields.router, prefix="/api/yields", tags=["Yields"])
app.include_router(stress.router, prefix="/api/stress", tags=["Stress"])
app.include_router(dealflow.router, prefix="/api/dealflow", tags=["Deal Flow"])
app.include_router(managers.router, prefix="/api/managers", tags=["Managers"])
app.include_router(macro.router, prefix="/api/macro", tags=["Macro"])

@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "version": "1.0.0"}

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global error handler caught exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error occurred", "message": str(exc)}
    )
