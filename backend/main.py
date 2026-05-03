# FastAPI app entry point
from fastapi import FastAPI
from app.api import admin

app = FastAPI(title="Djup API")

app.include_router(admin.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Djup API"}
