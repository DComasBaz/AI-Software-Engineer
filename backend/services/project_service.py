"""
Business logic layer — keeps route handlers thin and testable.
"""
from __future__ import annotations

import json
import os
import shutil
import zipfile
from pathlib import Path

from sqlalchemy.orm import Session

from agent.graph import agent, init_progress, update_progress, cancel_task
from agent.tools import init_project_root, set_project_root
from core.exceptions import ProjectNotFoundError, SessionNotFoundError, TaskCancelledError
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

    except TaskCancelledError:
        update_progress(session_id, status="cancelled", message="Cancelled by user.")
        logger.info("Agent task cancelled for session %s", session_id)

        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if session:
            session.status = "cancelled"
            session.output = "Cancelled by user."
            db.commit()

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


def cancel_session(session_id: str) -> None:
    cancel_task(session_id)


def prepare_new_session(db: Session, prompt: str) -> tuple[ChatSession, Path]:
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
    """Creates a sub-session for a modification request.

    Resolves to the true root session, then finds the latest state (most recent
    sub-session or root itself) to use as the base for the new modification.
    Each session gets its own isolated folder so downloads are independent.
    """
    source = get_session_or_404(db, existing_session_id)
    root_session_id = source.parent_session_id or source.id
    root = get_session_or_404(db, root_session_id)

    if not root.project_path:
        raise ProjectNotFoundError("(no path stored)")

    # Use the most recent sub-session as the base so chained modifications
    # build on top of each other rather than always starting from the original.
    latest_sub = (
        db.query(ChatSession)
        .filter(ChatSession.parent_session_id == root_session_id)
        .order_by(ChatSession.created_at.desc())
        .first()
    )
    current_path = Path(
        latest_sub.project_path if latest_sub and latest_sub.project_path
        else root.project_path
    )
    if not current_path.exists():
        raise ProjectNotFoundError(str(current_path))

    # Snapshot the current state before touching anything
    existing_snapshots = [
        d for d in current_path.parent.iterdir()
        if d.is_dir() and d.name.startswith(f"{root_session_id}_v")
    ]
    snapshot_path = current_path.parent / f"{root_session_id}_v{len(existing_snapshots) + 1}"
    shutil.copytree(current_path, snapshot_path)
    logger.info("Snapshotted -> %s", snapshot_path)

    new_session = ChatSession(
        prompt=prompt,
        status="pending",
        parent_session_id=root_session_id,
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    new_project_path = init_project_root(new_session.id)
    shutil.copytree(current_path, new_project_path, dirs_exist_ok=True)
    new_session.project_path = str(new_project_path)
    db.commit()

    set_project_root(new_project_path)
    return new_session, new_project_path


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
        for root, _dirs, files in os.walk(project_path):
            for file in files:
                file_path = Path(root) / file
                arcname = file_path.relative_to(project_path.parent)
                zf.write(file_path, arcname)

    return zip_path

    return zip_path