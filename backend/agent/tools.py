"""
File-system tools for the coder agent.

Thread/async safety: project root is stored in a contextvars.ContextVar so
each concurrent request gets its own isolated value instead of sharing a
single global.
"""
import pathlib
import subprocess
from contextvars import ContextVar

from langchain_core.tools import tool

from core.config import settings
from core.logger import get_logger

logger = get_logger(__name__)

PROJECTS_BASE: pathlib.Path = settings.projects_base

# ContextVar keeps the project root isolated per async task / thread.
_project_root_var: ContextVar[pathlib.Path] = ContextVar(
    "_project_root_var",
    default=PROJECTS_BASE,
)


def set_project_root(path: pathlib.Path) -> None:
    _project_root_var.set(path)


def get_project_root() -> pathlib.Path:
    return _project_root_var.get()


def init_project_root(session_id: str) -> pathlib.Path:
    """Creates a unique project folder for the session and sets it as active."""
    project_path = PROJECTS_BASE / session_id
    project_path.mkdir(parents=True, exist_ok=True)
    set_project_root(project_path)
    logger.info("Project root initialised: %s", project_path)
    return project_path


def _safe_path(path: str) -> pathlib.Path:
    """Resolves *path* relative to the project root and prevents path traversal."""
    root = get_project_root().resolve()
    resolved = (root / path).resolve()
    # The resolved path must be equal to or inside the project root
    if resolved != root and root not in resolved.parents:
        raise ValueError(f"Path '{path}' escapes the project root — write blocked.")
    return resolved


# ---------------------------------------------------------------------------
# LangChain tools
# ---------------------------------------------------------------------------

@tool
def write_file(path: str, content: str) -> str:
    """Writes *content* to *path* inside the project root. Creates directories as needed."""
    p = _safe_path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")
    logger.debug("wrote: %s (%d bytes)", p, len(content))
    return f"OK: wrote {p}"


@tool
def read_file(path: str) -> str:
    """Returns the text content of *path* inside the project root, or empty string if missing."""
    p = _safe_path(path)
    if not p.exists():
        return ""
    return p.read_text(encoding="utf-8")


@tool
def list_files(directory: str = ".") -> str:
    """Lists all files under *directory* inside the project root, one per line."""
    p = _safe_path(directory)
    if not p.is_dir():
        return f"ERROR: '{directory}' is not a directory"
    root = get_project_root()
    files = [str(f.relative_to(root)) for f in p.glob("**/*") if f.is_file()]
    return "\n".join(sorted(files)) if files else "No files found."

@tool
def list_file(directory: str = ".") -> str:
    """Alias for list_files — lists files in a directory."""
    return list_files.run(directory)

@tool
def get_current_directory() -> str:
    """Returns the absolute path of the active project root directory."""
    return str(get_project_root())


@tool
def run_cmd(cmd: str, cwd: str = ".", timeout: int = 30) -> str:
    """
    Runs a shell command inside the project root and returns combined stdout/stderr.
    Use sparingly — prefer file tools for code generation tasks.
    """
    cwd_path = _safe_path(cwd)
    result = subprocess.run(
        cmd,
        shell=True,
        cwd=str(cwd_path),
        capture_output=True,
        text=True,
        timeout=timeout,
    )
    output = result.stdout + result.stderr
    logger.debug("run_cmd [rc=%d] %s", result.returncode, cmd)
    return f"[rc={result.returncode}]\n{output}"