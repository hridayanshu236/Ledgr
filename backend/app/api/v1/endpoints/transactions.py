from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.transaction import Transaction as TransactionORM
from app.schemas.transaction import TransactionBatch, TransactionItem
from app.services.persistence import save_batch

router = APIRouter()


@router.get("/", response_model=list[TransactionItem])
def list_transactions(db: Session = Depends(get_db)) -> list[TransactionORM]:
    return (
        db.query(TransactionORM)
        .order_by(TransactionORM.created_at.desc())
        .limit(50)
        .all()
    )


@router.post("/confirm/", response_model=TransactionBatch)
def confirm_batch(batch: TransactionBatch, db: Session = Depends(get_db)) -> TransactionBatch:
    save_batch(batch, db)
    return batch
