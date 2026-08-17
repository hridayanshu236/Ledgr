from fastapi import FastAPI
from app.api.v1.router import router

app = FastAPI(title="Ledgr API", version="1.0.0")


@app.get("/health")
def health_check():
    return {"status": "ok"}


app.include_router(router, prefix="/api/v1")