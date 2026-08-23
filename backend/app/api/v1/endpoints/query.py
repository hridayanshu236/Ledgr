from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.services.agent import router as agent_router
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()


class QueryRequest(BaseModel):
    question: str
    history: list[dict[str, str]] | None = None


class QueryResponse(BaseModel):
    answer: str


@router.post("/", response_model=QueryResponse)
async def query(
    request: QueryRequest, current_user: User = Depends(get_current_user)
) -> QueryResponse:
    if not current_user.api_key:
        raise HTTPException(status_code=400, detail="Missing Gemini API Key. Please add it in Settings.")
    result = await agent_router.answer(request.question, current_user.id, current_user.api_key, request.history)
    return QueryResponse(answer=result)
