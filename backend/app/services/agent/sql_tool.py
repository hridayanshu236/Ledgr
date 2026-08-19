import re

from langchain_google_genai import ChatGoogleGenerativeAI
from sqlalchemy import text

from app.config import settings
from app.db.session import engine

SCHEMA_CONTEXT = """
Tables:
  transactions(id TEXT, merchant_or_entity TEXT, date DATE, amount NUMERIC,
               payment_method TEXT, category TEXT, remarks TEXT, created_at DATE)
  line_items(id TEXT, transaction_id TEXT REFERENCES transactions(id),
             name TEXT, quantity NUMERIC, unit_price NUMERIC, total_price NUMERIC)
"""

_SQL_GEN_PROMPT = (
    "You are a SQLite expert. Given the schema below and a user question, "
    "write a single read-only SELECT query that answers the question. "
    "Return ONLY the raw SQL statement with no explanation, no markdown, no backticks.\n"
    f"Schema:\n{SCHEMA_CONTEXT}"
)

_FORBIDDEN = re.compile(
    r"\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|REPLACE|MERGE)\b",
    re.IGNORECASE,
)


def _is_safe(sql: str) -> bool:
    return not bool(_FORBIDDEN.search(sql))


def _extract_text(content: object) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for part in content:
            if isinstance(part, str):
                parts.append(part)
            elif isinstance(part, dict) and "text" in part:
                parts.append(str(part["text"]))
        return "".join(parts)
    return str(content)


def query_sql(question: str) -> str:
    llm = ChatGoogleGenerativeAI(
        model="gemini-3.6-flash",
        google_api_key=settings.google_api_key,
    )

    response = llm.invoke(f"{_SQL_GEN_PROMPT}\nQuestion: {question}")
    raw_text = _extract_text(response.content).strip()

    # Strip code fences if the model wraps output in markdown
    sql = (
        raw_text.removeprefix("```sql")
        .removeprefix("```")
        .removesuffix("```")
        .strip()
    )

    if not _is_safe(sql):
        return f"Blocked: the generated SQL contained a write operation. SQL was: {sql}"

    try:
        with engine.connect() as conn:
            rows = conn.execute(text(sql)).mappings().all()
        if not rows:
            return "Query returned no results."
        return "\n".join(str(dict(row)) for row in rows)
    except Exception as exc:
        return f"SQL execution error: {exc}"