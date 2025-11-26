from dotenv import load_dotenv
from langchain_core.globals import set_verbose, set_debug
from langchain_groq import ChatGroq
from langgraph.constants import END
from langgraph.graph import StateGraph
from langchain.agents import create_agent

from backend.agent.states import *
from backend.agent.prompts import *
from backend.agent.tools import read_file, write_file, list_files, get_current_directory, PROJECT_ROOT
import time
from datetime import datetime

load_dotenv()

llm = ChatGroq(model='moonshotai/kimi-k2-instruct-0905')

# Simple global progress tracker
progress_state = {
    "status": "idle",
    "message": "",
    "step": 0,
    "total": 0
}


def get_existing_project_context() -> str | None:
    """Returns a summary of existing project files, or None if project doesn't exist."""
    if not PROJECT_ROOT.exists():
        return None

    file_paths = [f for f in PROJECT_ROOT.glob("**/*") if f.is_file()]
    if not file_paths:
        return None

    file_list = "\n".join(f"- {f.relative_to(PROJECT_ROOT)}" for f in file_paths)
    return f"EXISTING PROJECT FILES:\n{file_list}"


def planner_agent(state_dict: dict) -> dict:
    """Converts user prompt into a structured Plan."""
    progress_state["status"] = "planning"
    progress_state["message"] = "Creating project plan..."

    user_prompt = state_dict['user_prompt']
    existing_context = get_existing_project_context()
    is_modification = existing_context is not None

    resp = llm.with_structured_output(Plan).invoke(
        planner_prompt(user_prompt, existing_context)
    )

    if resp is None:
        raise ValueError("Planner did not return a valid response")

    return {'plan': resp, 'is_modification': is_modification}


def architect_agent(state_dict: dict) -> dict:
    """Creates TaskPlan from Plan."""
    progress_state["status"] = "architecting"
    progress_state["message"] = "Designing project architecture..."

    plan = state_dict['plan']
    is_modification = state_dict.get('is_modification', False)

    resp = llm.with_structured_output(TaskPlan).invoke(
        architect_prompt(plan=plan, is_modification=is_modification)
    )

    if resp is None:
        raise ValueError("Architect did not return a valid response")

    resp.plan = plan

    progress_state["total"] = len(resp.implementation_steps)

    return {'task_plan': resp}


last_api_call = None
MIN_DELAY_SECONDS = 120


def coder_agent(state_dict: dict) -> dict:
    """LangGraph tool-using coder agent."""
    global last_api_call

    if last_api_call:
        elapsed = (datetime.now() - last_api_call).total_seconds()
        if elapsed < MIN_DELAY_SECONDS:
            time.sleep(MIN_DELAY_SECONDS - elapsed)

    coder_state = state_dict.get('coder_state')
    is_modification = state_dict.get('is_modification', False)

    if coder_state is None:
        coder_state = CoderState(task_plan=state_dict['task_plan'], current_step_idx=0)

    steps = coder_state.task_plan.implementation_steps

    if coder_state.current_step_idx >= len(steps):
        return {'coder_state': coder_state, "status": "DONE"}

    current_task = steps[coder_state.current_step_idx]

    # Update progress
    progress_state["status"] = "coding"
    progress_state["step"] = coder_state.current_step_idx + 1
    progress_state["message"] = f"Working on: {current_task.filepath}"

    existing_content = read_file.run(current_task.filepath)

    user_prompt = (
        f"Task: {current_task.task_description}\n"
        f"File: {current_task.filepath}\n"
        f"Existing content:\n{existing_content}\n"
        "Use write_file(path, content) to save your changes"
    )

    system_prompt = coder_prompt(is_modification=is_modification)

    coder_tools = [read_file, write_file, list_files, get_current_directory]
    react_agent = create_agent(model=llm, tools=coder_tools)

    last_api_call = datetime.now()

    react_agent.invoke({"messages": [{"role": "system", "content": system_prompt},
                                     {"role": "user", "content": user_prompt}]})

    print(f"✓ Step {coder_state.current_step_idx + 1}/{len(steps)}: {current_task.filepath}")

    coder_state.current_step_idx += 1
    return {"coder_state": coder_state}


graph = StateGraph(dict)

graph.add_node('planner', planner_agent)
graph.add_node('architect', architect_agent)
graph.add_node('coder', coder_agent)

graph.add_edge('planner', 'architect')
graph.add_edge('architect', 'coder')
graph.add_conditional_edges(
    "coder",
    lambda s: "END" if s.get("status") == "DONE" else "coder",
    {"END": END, "coder": "coder"}
)

graph.set_entry_point('planner')
agent = graph.compile()
