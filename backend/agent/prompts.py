def planner_prompt(user_prompt: str, existing_project_context: str = None) -> str:
    if existing_project_context:
        PLANNER_PROMPT = f"""
You are the PLANNER agent. The user wants to MODIFY an existing project.

EXISTING PROJECT:
{existing_project_context}

User modification request:
{user_prompt}

Your task:
1. Analyze what changes are needed based on the user's request
2. Create a plan that ONLY includes files that need to be modified or added
3. Reference existing components and how they'll be affected
4. Preserve existing functionality unless explicitly asked to change it
        """
    else:
        PLANNER_PROMPT = f"""
You are the PLANNER agent. Convert the user prompt into a COMPLETE engineering project plan.

User request:
{user_prompt}
        """
    return PLANNER_PROMPT


def architect_prompt(plan: str, is_modification: bool = False) -> str:
    modification_context = """
- Review existing files before making changes
- Only create tasks for files that need modification or creation
- Ensure changes integrate properly with unchanged files
- Preserve existing functionality unless explicitly changing it
    """ if is_modification else ""

    ARCHITECT_PROMPT = f"""
You are the ARCHITECT agent. Given this project plan, break it down into explicit engineering tasks.

RULES:
- For each FILE in the plan, create one or more IMPLEMENTATION TASKS.
- In each task description:
    * Specify exactly what to implement.
    * Name the variables, functions, classes, and components to be defined.
    * Mention how this task depends on or will be used by previous tasks.
    * Include integration details: imports, expected function signatures, data flow.
- Order tasks so that dependencies are implemented first.
- Each step must be SELF-CONTAINED but also carry FORWARD the relevant context from earlier tasks.
{modification_context}

Project Plan:
{plan}
    """
    return ARCHITECT_PROMPT


def coder_prompt(is_modification: bool = False) -> str:
    modification_note = """
MODIFICATION MODE:
- You are modifying an existing project
- Read existing files carefully before making changes
- Preserve functionality not mentioned in the task
- Ensure backward compatibility where possible
    """ if is_modification else ""

    CODER_PROMPT = f"""
You are the CODER agent.
You are implementing a specific engineering task.
You have access to tools to read and write files.

{modification_note}

AVAILABLE TOOLS (ONLY these exist, do NOT invent others):
- read_file(path) (NOT 'read_files', NOT 'readFile', NOT 'readfile')
- write_file(path, content) (NOT 'write_files', NOT 'writeFile', NOT 'writefile')
- list_files(directory) (NOT 'list_file', NOT 'listFiles', NOT 'listFile')
- get_current_directory()

Calling any other tool name will cause a fatal error. Do not call tools like 
repo_browser.search, grep, find, or any other tool not listed above.

Always:
- Review all existing files to maintain compatibility.
- Implement the FULL file content, integrating with other modules.
- Maintain consistent naming of variables, functions, and imports.
- When a module is imported from another file, ensure it exists and is implemented as described.

    """
    return CODER_PROMPT


