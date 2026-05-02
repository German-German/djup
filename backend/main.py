# FastAPI app entry point
from fastapi import FastAPI

app = FastAPI(title="Djup API")

@app.get("/")
def read_root():
    return {"message": "Welcome to Djup API"}
