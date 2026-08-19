import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.config import settings
from app.db.session import get_db
from app.models.transaction import LineItem, Transaction
from app.schemas.transaction import TransactionBatch
from app.services import extractor, vector_store

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

    for tx in batch.transactions:
        tx_id = str(uuid.uuid4())

        # Persist the original file so it can be reviewed or re-processed later
        ext = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "bin"
        upload_path = Path(settings.upload_dir) / f"{tx_id}.{ext}"
        upload_path.parent.mkdir(parents=True, exist_ok=True)
        upload_path.write_bytes(file_bytes)

        db_tx = Transaction(
            id=tx_id,
            merchant_or_entity=tx.merchant_or_entity,
            date=tx.date,
            amount=tx.amount,
            payment_method=tx.payment_method,
            category=tx.category,
            remarks=tx.remarks,
            file_path=str(upload_path),
        )
        db_tx.line_items = [
            LineItem(
                id=str(uuid.uuid4()),
                transaction_id=tx_id,
                name=item.name,
                quantity=item.quantity,
                unit_price=item.unit_price,
                total_price=item.total_price,
            )
            for item in tx.line_items
        ]

        db.add(db_tx)
        db.commit()

        # Index in ChromaDB only after the SQL commit succeeds
        vector_store.index_transaction(tx, tx_id)

    return batch
