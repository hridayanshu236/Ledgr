from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.transaction import TransactionBatch
from app.services import extractor
from app.services.persistence import save_batch

router = APIRouter()

ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
}


@router.post("/", response_model=TransactionBatch)
async def ingest_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> TransactionBatch:
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type: {file.content_type}. Accepted: {sorted(ALLOWED_MIME_TYPES)}",
        )

    file_bytes = await file.read()
    batch = await extractor.extract(file_bytes, file.content_type)
    save_batch(batch, db, file_bytes=file_bytes, filename=file.filename)
    return batch
