from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.transaction import TransactionBatch
from app.services import extractor
from app.services.persistence import save_image_to_disk
from app.api.deps import get_current_user
from app.models.user import User

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
    current_user: User = Depends(get_current_user),
) -> TransactionBatch:
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type: {file.content_type}. Accepted: {sorted(ALLOWED_MIME_TYPES)}",
        )

    if not current_user.get_decrypted_api_key():
        raise HTTPException(status_code=400, detail="Missing API Key. Please add it in Settings.")

    file_bytes = await file.read()
    batch = await extractor.extract(file_bytes, file.content_type, current_user.get_decrypted_api_key())
    
    file_path = save_image_to_disk(file_bytes, file.filename)
    for tx in batch.transactions:
        tx.file_path = file_path
        
    return batch
