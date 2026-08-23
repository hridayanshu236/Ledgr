from sqlalchemy import bindparam, text

from app.db.session import engine
from app.services.vector_store import collection


def query_vector(question: str) -> str:
    results = collection.query(query_texts=[question], n_results=3)

    if not results["ids"][0]:
        return "No semantically similar transactions found."

    ids = [m["transaction_id"] for m in results["metadatas"][0]]

    stmt_tx = text(
        "SELECT id, merchant_or_entity, date, amount, category, payment_method, remarks "
        "FROM transactions WHERE id IN :ids"
    ).bindparams(bindparam("ids", expanding=True))

    stmt_li = text(
        "SELECT transaction_id, name, quantity, unit_price, total_price "
        "FROM line_items WHERE transaction_id IN :ids"
    ).bindparams(bindparam("ids", expanding=True))

    with engine.connect() as conn:
        tx_rows = conn.execute(stmt_tx, {"ids": ids}).mappings().all()
        li_rows = conn.execute(stmt_li, {"ids": ids}).mappings().all()

    if not tx_rows:
        return "No matching transactions found in the database."

    # Group line items by transaction_id
    li_by_tx = {}
    for li in li_rows:
        tx_id = li["transaction_id"]
        if tx_id not in li_by_tx:
            li_by_tx[tx_id] = []
        # exclude transaction_id from the printed dict to keep context clean
        li_dict = dict(li)
        del li_dict["transaction_id"]
        li_by_tx[tx_id].append(li_dict)

    result_strings = []
    for tx in tx_rows:
        tx_dict = dict(tx)
        tx_id = tx_dict.pop("id")
        tx_dict["line_items"] = li_by_tx.get(tx_id, [])
        result_strings.append(str(tx_dict))

    return "\n".join(result_strings)
