from fastapi import APIRouter, File, HTTPException, UploadFile

from app.schemas.transaction import TransactionBatch
from app.services import extractor

router = APIRouter()

ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
}


@router.post("/", response_model=TransactionBatch)
async def ingest_file(file: UploadFile = File(...)) -> TransactionBatch:
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type: {file.content_type}. Accepted: {sorted(ALLOWED_MIME_TYPES)}",
        )

    file_bytes = await file.read()
    return await extractor.extract(file_bytes, file.content_type)
