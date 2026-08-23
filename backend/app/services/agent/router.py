import inspect

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from langchain_core.tools import StructuredTool
from langchain_google_genai import ChatGoogleGenerativeAI

from app.config import settings
from app.services.agent.sql_tool import query_sql
from app.services.agent.vector_tool import query_vector


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


_tools = [
    StructuredTool.from_function(
        coroutine=query_sql,
        name="sql_query",
        description=(
            "Use for quantitative questions: totals, averages, counts, date-range filters, "
            "spending by category or payment method. Example: 'how much did I spend on dining?'"
        ),
    ),
    StructuredTool.from_function(
        func=query_vector,
        name="semantic_search",
        description=(
            "Use for fuzzy or memory-style questions about specific purchases, merchants, "
            "or items. Example: 'where did I buy soup momo?' or 'find my last Khalti payment'. "
            "Do NOT use for aggregations or totals."
        ),
    ),
]

_TOOL_MAP = {
    "sql_query": query_sql,
    "semantic_search": query_vector,
}


def _build_messages(question: str, history: list[dict[str, str]] | None) -> list[BaseMessage]:
    messages: list[BaseMessage] = []
    if history:
        for msg in history:
            if msg.get("role") == "user":
                messages.append(HumanMessage(content=msg.get("content", "")))
            elif msg.get("role") == "bot":
                messages.append(AIMessage(content=msg.get("content", "")))
    messages.append(HumanMessage(content=question))
    return messages


async def answer(question: str, history: list[dict[str, str]] | None = None) -> str:
    llm = ChatGoogleGenerativeAI(
        model=settings.model_name,
        google_api_key=settings.google_api_key,
    )
    llm_with_tools = llm.bind_tools(_tools)

    # 1. Routing call
    messages = _build_messages(question, history)
    response = await llm_with_tools.ainvoke(messages)

    if not response.tool_calls:
        return _extract_text(response.content)

    # 2. Execute selected tool
    tool_call = response.tool_calls[0]
    tool_name = tool_call["name"]
    tool_fn = _TOOL_MAP.get(tool_name)

    if tool_fn is None:
        return f"The model selected an unknown tool: {tool_name}"

    tool_args = tool_call.get("args", {})
    query_param = tool_args.get("question", question)

    # Inject recent history so the tool LLM understands pronouns like "it" or "that bill"
    history_str = ""
    if history:
        history_str = "Conversation History:\n" + "\n".join([f"{m.get('role')}: {m.get('content')}" for m in history[-4:]]) + "\n\n"
    
    enriched_query = f"{history_str}Current Question: {query_param}"

    if inspect.iscoroutinefunction(tool_fn):
        tool_result = await tool_fn(enriched_query)
    else:
        tool_result = tool_fn(enriched_query)

    # 3. Final synthesis without breaking thought signatures
    synthesis_prompt = (
        f"System Context:\nDatabase Result from {tool_name}:\n{tool_result}\n\n"
        "Instructions:\n"
        "1. All monetary amounts are in Nepali Rupees (NPR). Always express amounts as 'NPR X' or 'Rs X', never as '$'.\n"
        "2. Provide a clear, direct answer to the user's last question using the database result above.\n"
        "3. IMPORTANT: Provide the answer in PLAIN TEXT only. Do NOT use any markdown formatting (no **asterisks** for bold, no italics, no code blocks)."
    )

    synthesis_messages = messages[:-1] + [HumanMessage(content=f"{messages[-1].content}\n\n{synthesis_prompt}")]
    final_response = await llm.ainvoke(synthesis_messages)
    return _extract_text(final_response.content)