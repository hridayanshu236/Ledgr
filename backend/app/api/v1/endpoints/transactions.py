import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.transaction import Transaction as TransactionORM, LineItem as LineItemORM
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


@router.put("/{tx_id}", response_model=TransactionItem)
def update_transaction(tx_id: str, tx: TransactionItem, db: Session = Depends(get_db)):
    db_tx = db.query(TransactionORM).filter(TransactionORM.id == tx_id).first()
    if not db_tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    db_tx.merchant_or_entity = tx.merchant_or_entity
    db_tx.date = tx.date
    db_tx.amount = tx.amount
    db_tx.payment_method = tx.payment_method
    db_tx.category = tx.category
    db_tx.remarks = tx.remarks
    
    # Update line items by replacing them
    db.query(LineItemORM).filter(LineItemORM.transaction_id == tx_id).delete()
    
    db_tx.line_items = [
        LineItemORM(
            id=str(uuid.uuid4()),
            transaction_id=tx_id,
            name=item.name,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total_price=item.total_price,
        )
        for item in tx.line_items
    ]
    
    db.commit()
    
    from app.services import vector_store
    vector_store.update_transaction(tx, tx_id)
    
    return tx


@router.delete("/{tx_id}")
def delete_transaction(tx_id: str, db: Session = Depends(get_db)):
    db_tx = db.query(TransactionORM).filter(TransactionORM.id == tx_id).first()
    if not db_tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    db.delete(db_tx)
    db.commit()
    
    from app.services import vector_store
    vector_store.delete_transaction(tx_id)
    
    return {"status": "success"}
