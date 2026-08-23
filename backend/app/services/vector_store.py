import chromadb

from app.config import settings
from app.schemas.transaction import TransactionItem

client = chromadb.PersistentClient(path="./data/chroma_db")
collection = client.get_or_create_collection(name="transactions")


def index_transaction(tx: TransactionItem, transaction_id: str) -> None:
    item_names = " ".join(item.name for item in tx.line_items)
    document = f"{tx.merchant_or_entity} {item_names} {tx.remarks or ''}".strip()

    collection.add(
        documents=[document],
        metadatas=[{"transaction_id": transaction_id}],
        ids=[transaction_id],
    )


def delete_transaction(transaction_id: str) -> None:
    collection.delete(ids=[transaction_id])


def update_transaction(tx: TransactionItem, transaction_id: str) -> None:
    item_names = " ".join(item.name for item in tx.line_items)
    document = f"{tx.merchant_or_entity} {item_names} {tx.remarks or ''}".strip()
    
    collection.update(
        documents=[document],
        metadatas=[{"transaction_id": transaction_id}],
        ids=[transaction_id],
    )
