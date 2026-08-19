from sqlalchemy import bindparam, text

from app.db.session import engine
from app.services.vector_store import collection


def query_vector(question: str) -> str:
    results = collection.query(query_texts=[question], n_results=3)

    if not results["ids"][0]:
        return "No semantically similar transactions found."

    ids = [m["transaction_id"] for m in results["metadatas"][0]]

    stmt = text(
        "SELECT merchant_or_entity, date, amount, category, payment_method, remarks "
        "FROM transactions WHERE id IN :ids"
    ).bindparams(bindparam("ids", expanding=True))

    with engine.connect() as conn:
        rows = conn.execute(stmt, {"ids": ids}).mappings().all()

    if not rows:
        return "No matching transactions found in the database."

    return "\n".join(str(dict(row)) for row in rows)
