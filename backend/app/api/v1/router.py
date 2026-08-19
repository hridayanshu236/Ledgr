# The v1 route aggregator. It creates an APIRouter() and uses router.include_router() to mount each feature's sub-router (ingest, query, transactions). Right now it can be empty with just the router declaration — endpoints are added in Stage 2 onwards. Keeping routes in a separate file from main.py prevents that file from becoming a monolith.
from fastapi import APIRouter

from app.api.v1.endpoints import ingest, query, transactions

router = APIRouter()

router.include_router(ingest.router, prefix="/ingest", tags=["ingest"])
router.include_router(query.router, prefix="/query", tags=["query"])
router.include_router(transactions.router, prefix="/transactions", tags=["transactions"])