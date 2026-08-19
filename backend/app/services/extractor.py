import base64

from langchain_core.messages import HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from app.config import settings
from app.schemas.transaction import TransactionBatch

SYSTEM_PROMPT = (
    "You are a financial data extraction assistant. "
    "Extract all transactions from the provided receipt, payment screenshot, or bank statement. "
    "Use NPR as the default currency. "
    "Translate merchant names to English even if printed in Devanagari. "
    "Infer the category from the merchant type if it is not explicitly stated. "
    "If the date is unreadable, use today's date. "
    "Return an empty line_items list if individual items are not visible."
)


async def extract(file_bytes: bytes, mime_type: str) -> TransactionBatch:
    llm = ChatGoogleGenerativeAI(
        model="gemini-3.6-flash",
        google_api_key=settings.google_api_key,
    )
    structured_llm = llm.with_structured_output(TransactionBatch)

    b64 = base64.standard_b64encode(file_bytes).decode("utf-8")
    message = HumanMessage(
        content=[
            {
                "type": "image_url",
                "image_url": {"url": f"data:{mime_type};base64,{b64}"},
            },
            {"type": "text", "text": SYSTEM_PROMPT},
        ]
    )
    return await structured_llm.ainvoke([message])
