"""
Routes for project creation and downloads.
"""
import asyncio

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from api.deps import get_db
from core.exceptions import AppError
from database.database import SessionLocal
from schemas.project import ProjectCreateRequest, ProjectCreateResponse
from services.project_service import (
    build_project_zip,
    cancel_session,
    get_session_or_404,
    prepare_modification_session,
    prepare_new_session,
    run_agent_task,
)

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("", response_model=ProjectCreateResponse, status_code=202)
async def create_project(
    request: ProjectCreateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Starts project generation asynchronously.
    Returns immediately with a session_id; poll /sessions/{session_id}/progress for status.
    """
    try:
        if request.existing_session_id:
            session, project_path = prepare_modification_session(
                db, request.prompt, request.existing_session_id
            )
        else:
            session, project_path = prepare_new_session(db, request.prompt)
    except AppError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)

    background_tasks.add_task(
        run_agent_task,
        session_id=session.id,
        prompt=request.prompt,
        recursion_limit=request.recursion_limit,
        project_path=project_path,
        db_session_factory=SessionLocal,
    )

    return ProjectCreateResponse(
        session_id=session.id,
        status="pending",
        message="Project generation started. Poll /sessions/{session_id}/progress for status.",
    )


@router.post("/{session_id}/cancel", status_code=200)
def cancel_project(session_id: str, db: Session = Depends(get_db)):
    """
    Signals the background agent task to stop after its current step.
    The task checks this flag at the start of every coder_node iteration,
    so cancellation takes effect between file writes (not mid-LLM-call).
    """
    try:
        session = get_session_or_404(db, session_id)
    except AppError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)

    if session.status not in ("pending", "running"):
        raise HTTPException(
            status_code=400,
            detail=f"Session is not running (status: {session.status})",
        )

    cancel_session(session_id)
    return {"ok": True, "message": "Cancellation requested"}


@router.get("/{session_id}/download")
def download_project(session_id: str, db: Session = Depends(get_db)):
    """Streams the project folder as a ZIP archive."""
    try:
        session = get_session_or_404(db, session_id)
        zip_path = build_project_zip(session)
    except AppError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)

    async def cleanup():
        await asyncio.sleep(5)
        if zip_path.exists():
            zip_path.unlink()

    tasks = BackgroundTasks()
    tasks.add_task(cleanup)

    return FileResponse(
        path=str(zip_path),
        filename="project.zip",
        media_type="application/zip",
        background=tasks,
    )
