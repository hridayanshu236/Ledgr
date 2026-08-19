import inspect

from langchain_core.messages import HumanMessage
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
        func=query_sql,
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


async def answer(question: str) -> str:
    llm = ChatGoogleGenerativeAI(
        model="gemini-3.6-flash",
        google_api_key=settings.google_api_key,
    )
    llm_with_tools = llm.bind_tools(_tools)

    # 1. Routing call
    response = await llm_with_tools.ainvoke([HumanMessage(content=question)])

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

    if inspect.iscoroutinefunction(tool_fn):
        tool_result = await tool_fn(query_param)
    else:
        tool_result = tool_fn(query_param)

    # 3. Final synthesis without breaking thought signatures
    synthesis_prompt = (
        f"User Question: {question}\n\n"
        f"Database Result from {tool_name}:\n{tool_result}\n\n"
        "Provide a clear, direct answer to the user question using the data above."
    )

    final_response = await llm.ainvoke([HumanMessage(content=synthesis_prompt)])
    return _extract_text(final_response.content)