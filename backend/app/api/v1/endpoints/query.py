from fastapi import APIRouter
from pydantic import BaseModel

from app.services.agent import router as agent_router

router = APIRouter()


class QueryRequest(BaseModel):
    question: str


class QueryResponse(BaseModel):
    answer: str


@router.post("/", response_model=QueryResponse)
async def query(request: QueryRequest) -> QueryResponse:
    result = await agent_router.answer(request.question)
    return QueryResponse(answer=result)
