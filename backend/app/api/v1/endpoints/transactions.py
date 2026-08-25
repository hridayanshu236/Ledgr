import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_, extract

from app.db.session import get_db
from app.models.transaction import Transaction as TransactionORM, LineItem as LineItemORM
from app.models.user import User
from app.schemas.transaction import TransactionBatch, TransactionItem
from app.services.persistence import save_batch
from app.api.deps import get_current_user
from app.services.budget_monitor import check_budget_thresholds

router = APIRouter()


@router.get("/", response_model=list[TransactionItem])
def list_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    search: str | None = None,
    month: str | None = None,
    category: str | None = None,
    payment_method: str | None = None,
    sort_by: str = Query("date", pattern="^(date|amount)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$")
) -> list[TransactionORM]:
    query = db.query(TransactionORM).filter(TransactionORM.user_id == current_user.id)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                TransactionORM.merchant_or_entity.ilike(search_term),
                TransactionORM.remarks.ilike(search_term)
            )
        )
    if month:
        try:
            y, m = month.split("-")
            query = query.filter(
                extract('year', TransactionORM.date) == int(y),
                extract('month', TransactionORM.date) == int(m)
            )
        except ValueError:
            pass
    if category:
        query = query.filter(TransactionORM.category.ilike(f"%{category}%"))
    if payment_method:
        query = query.filter(TransactionORM.payment_method.ilike(f"%{payment_method}%"))
        
    sort_col = TransactionORM.date if sort_by == "date" else TransactionORM.amount
    if sort_order == "desc":
        sort_col = sort_col.desc()
    else:
        sort_col = sort_col.asc()
        
    query = query.order_by(sort_col, TransactionORM.created_at.desc())
    return query.all()


@router.post("/confirm/", response_model=TransactionBatch)
def confirm_batch(
    batch: TransactionBatch,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> TransactionBatch:
    save_batch(batch, db, current_user.id)
    
    # Check budget thresholds asynchronously
    for tx in batch.transactions:
        background_tasks.add_task(check_budget_thresholds, current_user.id, tx)
        
    return batch


@router.put("/{tx_id}", response_model=TransactionItem)
def update_transaction(
    tx_id: str, 
    tx: TransactionItem,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_tx = db.query(TransactionORM).filter(
        TransactionORM.id == tx_id, 
        TransactionORM.user_id == current_user.id
    ).first()
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
    vector_store.update_transaction(tx, tx_id, current_user.id)
    
    background_tasks.add_task(check_budget_thresholds, current_user.id, tx)
    
    return tx


@router.delete("/{tx_id}")
def delete_transaction(
    tx_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_tx = db.query(TransactionORM).filter(
        TransactionORM.id == tx_id, 
        TransactionORM.user_id == current_user.id
    ).first()
    if not db_tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    db.delete(db_tx)
    db.commit()
    
    from app.services import vector_store
    vector_store.delete_transaction(tx_id)
    
    return {"status": "success"}
