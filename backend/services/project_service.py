"""
Business logic layer — keeps route handlers thin and testable.
"""
from __future__ import annotations

import json
import zipfile
from pathlib import Path

from sqlalchemy.orm import Session

from agent.graph import agent, init_progress, update_progress
from agent.tools import init_project_root, set_project_root
from core.exceptions import ProjectNotFoundError, SessionNotFoundError
from core.logger import get_logger
from database.models import ChatSession

logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# Session helpers
# ---------------------------------------------------------------------------

def get_session_or_404(db: Session, session_id: str) -> ChatSession:
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise SessionNotFoundError(session_id)
    return session


# ---------------------------------------------------------------------------
# Project creation (runs in background)
# ---------------------------------------------------------------------------

def run_agent_task(
    session_id: str,
    prompt: str,
    recursion_limit: int,
    project_path: Path,
    db_session_factory,
) -> None:
    """
    Called from a background thread/task.  Updates DB and progress_store.
    Creates its own DB session because FastAPI's request-scoped session is
    already closed by the time this runs.
    """
    init_progress(session_id)

    set_project_root(project_path)

    db = db_session_factory()
    try:
        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if session:
            session.status = "running"
            db.commit()

        result = agent.invoke(
            {"user_prompt": prompt, "session_id": session_id},
            {"recursion_limit": recursion_limit},
        )

        update_progress(session_id, status="complete", message="Project ready!")

        try:
            output_text = json.dumps(result, default=str)
        except Exception:
            output_text = str(result)

        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if session:
            session.status = "done"
            session.output = output_text
            session.download_ready = 1
            db.commit()

        logger.info("Agent task completed for session %s", session_id)

    except Exception as exc:
        update_progress(session_id, status="error", message=str(exc))
        logger.exception("Agent task failed for session %s", session_id)

        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if session:
            session.status = "error"
            session.output = str(exc)
            db.commit()
    finally:
        db.close()
        # Clean up progress store after a delay would go here in production
        # (e.g. a background cleanup job)


def prepare_new_session(db: Session, prompt: str) -> tuple[ChatSession, Path]:
    """Creates a DB session record and initialises the project folder."""
    session = ChatSession(prompt=prompt, status="pending")
    db.add(session)
    db.commit()
    db.refresh(session)

    project_path = init_project_root(session.id)
    session.project_path = str(project_path)
    db.commit()

    return session, project_path


def prepare_modification_session(
    db: Session, prompt: str, existing_session_id: str
) -> tuple[ChatSession, Path]:
    """Reuses an existing project folder for a modification request.

    Instead of inserting a new ChatSession row (which created a duplicate
    history entry), we reset the existing session in-place so the history
    entry is updated rather than duplicated.
    """
    existing = get_session_or_404(db, existing_session_id)

    if not existing.project_path:
        raise ProjectNotFoundError("(no path stored)")

    project_path = Path(existing.project_path)
    if not project_path.exists():
        raise ProjectNotFoundError(str(project_path))

    set_project_root(project_path)

    # Reset the existing session so it re-runs against the same project folder.
    # This avoids creating a duplicate history entry on every modification.
    existing.prompt = prompt
    existing.status = "pending"
    existing.output = None
    existing.download_ready = 0
    db.commit()
    db.refresh(existing)

    return existing, project_path


# ---------------------------------------------------------------------------
# Download helper
# ---------------------------------------------------------------------------

def build_project_zip(session: ChatSession) -> Path:
    if not session.project_path:
        raise ProjectNotFoundError("(no path stored)")

    project_path = Path(session.project_path)
    if not project_path.exists():
        raise ProjectNotFoundError(str(project_path))

    zip_path = project_path.parent / f"{session.id}.zip"
    if zip_path.exists():
        zip_path.unlink()

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, _dirs, files in __import__("os").walk(project_path):
            for file in files:
                file_path = Path(root) / file
                arcname = file_path.relative_to(project_path.parent)
                zf.write(file_path, arcname)

    return zip_path