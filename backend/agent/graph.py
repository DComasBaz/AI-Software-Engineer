"""
LangGraph agent workflow: Planner → Architect → Coder (loop).

Progress is tracked per-session via a module-level dict so SSE endpoints
can stream status to the correct client.  For multi-worker deployments,
replace this dict with Redis.
"""
from __future__ import annotations

from typing import Any

from langchain_groq import ChatGroq
from langgraph.constants import END
from langgraph.graph import StateGraph
from langgraph.prebuilt import create_react_agent
from tenacity import retry, stop_after_attempt, wait_exponential

from agent.prompts import architect_prompt, coder_prompt, planner_prompt
from agent.states import CoderState, Plan, TaskPlan
from agent.tools import (
    get_current_directory,
    get_project_root,
    list_files,
    list_file,
    read_file,
    write_file,
)
from core.config import settings
from core.exceptions import TaskCancelledError
from core.logger import get_logger

logger = get_logger(__name__)

# ---------------------------------------------------------------------------
# Per-session progress store  (replace with Redis for multi-worker setups)
# ---------------------------------------------------------------------------
progress_store: dict[str, dict[str, Any]] = {}


def init_progress(session_id: str) -> None:
    progress_store[session_id] = {
        "session_id": session_id,
        "status": "starting",
        "message": "Initialising...",
        "step": 0,
        "total": 0,
        "cancelled": False,      # <-- cancellation flag
    }


def update_progress(session_id: str, **kwargs: Any) -> None:
    if session_id in progress_store:
        progress_store[session_id].update(kwargs)
    logger.info("[%s] %s", session_id, kwargs.get("message", ""))


def cancel_task(session_id: str) -> None:
    """Signal the background task to stop after its current step."""
    if session_id in progress_store:
        progress_store[session_id]["cancelled"] = True
        logger.info("[%s] Cancellation requested", session_id)


def is_cancelled(session_id: str) -> bool:
    return progress_store.get(session_id, {}).get("cancelled", False)


# ---------------------------------------------------------------------------
# LLM
# ---------------------------------------------------------------------------
llm = ChatGroq(
    model=settings.groq_model,
    api_key=settings.groq_api_key,
)

_coder_tools = [read_file, write_file, list_files, list_file, get_current_directory]
_coder_agent = create_react_agent(model=llm, tools=_coder_tools)


# ---------------------------------------------------------------------------
# Helper: build existing-project context string
# ---------------------------------------------------------------------------
def _get_existing_project_context() -> str | None:
    project_root = get_project_root()
    if not project_root.exists():
        return None

    file_paths = [f for f in project_root.glob("**/*") if f.is_file()]
    if not file_paths:
        return None

    lines = ["EXISTING PROJECT FILES:"]
    for f in file_paths:
        rel = f.relative_to(project_root)
        lines.append(f"\n--- {rel} ---")
        try:
            content = f.read_text(encoding="utf-8")
            if len(content) > 2000:
                content = content[:2000] + "\n...[truncated]"
            lines.append(content)
        except Exception:
            lines.append("[binary or unreadable file]")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Retry decorator for Groq rate-limit and tool-parse errors
# ---------------------------------------------------------------------------
try:
    from groq import RateLimitError as GroqRateLimitError
    from groq import BadRequestError as GroqBadRequestError
except ImportError:
    GroqRateLimitError = Exception  # fallback
    GroqBadRequestError = Exception  # fallback


def _is_retryable(exc: BaseException) -> bool:
    """Retry on rate limits and tool-call JSON parse failures.

    LangChain wraps Groq's BadRequestError in its own exception types, so we
    walk the full cause chain and also match on message text for any exc type.
    """
    _tool_call_patterns = (
        "tool_use_failed",
        "failed to parse tool call",
        "attempted to call tool",
        "did not call a tool",
    )

    current: BaseException | None = exc
    while current is not None:
        if isinstance(current, GroqRateLimitError):
            return True
        if isinstance(current, GroqBadRequestError):
            msg = str(current).lower()
            if any(p in msg for p in _tool_call_patterns):
                return True
        # LangChain may re-raise as a plain exception — check the message too
        msg = str(current).lower()
        if any(p in msg for p in _tool_call_patterns):
            return True
        current = getattr(current, "__cause__", None) or getattr(current, "__context__", None)

    return False


_llm_retry = retry(
    retry=_is_retryable,
    wait=wait_exponential(multiplier=1, min=5, max=settings.min_delay_seconds),
    stop=stop_after_attempt(5),
    reraise=True,
)

# ---------------------------------------------------------------------------
# Graph nodes
# ---------------------------------------------------------------------------

def planner_node(state: dict) -> dict:
    session_id: str = state["session_id"]

    # Check cancellation before starting any LLM work
    if is_cancelled(session_id):
        raise TaskCancelledError("Cancelled before planning")

    update_progress(session_id, status="planning", message="Creating project plan...")

    user_prompt: str = state["user_prompt"]
    existing_context = _get_existing_project_context()
    is_modification = existing_context is not None

    @_llm_retry
    def _invoke() -> Plan:
        resp = llm.with_structured_output(Plan).invoke(
            planner_prompt(user_prompt, existing_context)
        )
        if resp is None:
            raise ValueError("Planner returned no response")
        return resp

    plan = _invoke()
    return {"plan": plan, "is_modification": is_modification, "session_id": session_id}


def architect_node(state: dict) -> dict:
    session_id: str = state["session_id"]

    if is_cancelled(session_id):
        raise TaskCancelledError("Cancelled before architecting")

    update_progress(session_id, status="architecting", message="Designing project architecture...")

    plan: Plan = state["plan"]
    is_modification: bool = state.get("is_modification", False)

    @_llm_retry
    def _invoke() -> TaskPlan:
        resp = llm.with_structured_output(TaskPlan).invoke(
            architect_prompt(plan=plan, is_modification=is_modification)
        )
        if resp is None:
            raise ValueError("Architect returned no response")
        return resp

    task_plan = _invoke()
    task_plan.plan = plan  # carry plan forward
    total = len(task_plan.implementation_steps)
    update_progress(session_id, total=total)
    return {"task_plan": task_plan, "session_id": session_id}


def coder_node(state: dict) -> dict:
    session_id: str = state["session_id"]

    # --- Cancellation check at the start of every step ---
    # This is the only safe point to interrupt: between file writes,
    # not mid-LLM-call which is not interruptible.
    if is_cancelled(session_id):
        raise TaskCancelledError("Cancelled between coding steps")

    is_modification: bool = state.get("is_modification", False)

    coder_state: CoderState | None = state.get("coder_state")
    if coder_state is None:
        coder_state = CoderState(task_plan=state["task_plan"], current_step_idx=0)

    steps = coder_state.task_plan.implementation_steps
    if coder_state.current_step_idx >= len(steps):
        return {"coder_state": coder_state, "status": "DONE", "session_id": session_id}

    current_task = steps[coder_state.current_step_idx]
    step_num = coder_state.current_step_idx + 1
    total = len(steps)

    update_progress(
        session_id,
        status="coding",
        step=step_num,
        total=total,
        message=f"[{step_num}/{total}] Writing {current_task.filepath}",
    )

    existing_content = read_file.run(current_task.filepath)

    user_msg = (
        f"Task: {current_task.task_description}\n"
        f"File: {current_task.filepath}\n"
        f"Existing content:\n{existing_content}\n"
        "Use write_file(path, content) to save your changes."
    )

    @_llm_retry
    def _invoke() -> Any:
        return _coder_agent.invoke({
            "messages": [
                {"role": "system", "content": coder_prompt(is_modification=is_modification)},
                {"role": "user", "content": user_msg},
            ]
        })

    result = _invoke()
    logger.info("✓ Step %d/%d: %s", step_num, total, current_task.filepath)

    coder_state.current_step_idx += 1
    return {"coder_state": coder_state, "agent_result": result, "session_id": session_id}


# ---------------------------------------------------------------------------
# Graph assembly
# ---------------------------------------------------------------------------

graph = StateGraph(dict)

graph.add_node("planner", planner_node)
graph.add_node("architect", architect_node)
graph.add_node("coder", coder_node)

graph.add_edge("planner", "architect")
graph.add_edge("architect", "coder")
graph.add_conditional_edges(
    "coder",
    lambda s: "END" if s.get("status") == "DONE" else "coder",
    {"END": END, "coder": "coder"},
)

graph.set_entry_point("planner")
agent = graph.compile()