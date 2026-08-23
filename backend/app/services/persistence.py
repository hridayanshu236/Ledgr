import uuid
from pathlib import Path

from sqlalchemy.orm import Session

from app.config import settings
from app.models.transaction import LineItem, Transaction
from app.schemas.transaction import TransactionBatch, TransactionItem
from app.services import vector_store


def save_image_to_disk(file_bytes: bytes, filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1] if "." in filename else "bin"
    file_id = str(uuid.uuid4())
    upload_path = Path(settings.upload_dir) / f"{file_id}.{ext}"
    upload_path.parent.mkdir(parents=True, exist_ok=True)
    upload_path.write_bytes(file_bytes)
    return str(upload_path)

def save_batch(
    batch: TransactionBatch,
    db: Session,
    user_id: str,
) -> None:
    for tx in batch.transactions:
        tx_id = str(uuid.uuid4())

        db_tx = Transaction(
            id=tx_id,
            user_id=user_id,
            merchant_or_entity=tx.merchant_or_entity,
            date=tx.date,
            amount=tx.amount,
            payment_method=tx.payment_method,
            category=tx.category,
            remarks=tx.remarks,
            file_path=tx.file_path,
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

        vector_store.index_transaction(tx, tx_id, user_id)
