from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.v1.router import router
from app.db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Ledgr API", version="1.0.0", lifespan=lifespan)


@app.get("/health")
def health_check():
    return {"status": "ok"}


app.include_router(router, prefix="/api/v1")
