"""
Routes for session history, progress streaming, and deletion.
"""
import asyncio
import json
import shutil

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from agent.graph import progress_store
from api.deps import get_db
from core.exceptions import AppError
from database.models import ChatSession
from schemas.project import SessionResponse
from services.project_service import get_session_or_404

router = APIRouter(prefix="/sessions", tags=["sessions"])


class MessagesUpdate(BaseModel):
    messages: list[dict]


@router.get("", response_model=list[SessionResponse])
def list_sessions(limit: int = 50, db: Session = Depends(get_db)):
    """Returns the most recent sessions, newest first."""
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.parent_session_id.is_(None))
        .order_by(ChatSession.created_at.desc())
        .limit(limit)
        .all()
    )
    return sessions


@router.get("/{session_id}", response_model=SessionResponse)
def get_session(session_id: str, db: Session = Depends(get_db)):
    try:
        return get_session_or_404(db, session_id)
    except AppError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.delete("/{session_id}", status_code=204)
def delete_session(session_id: str, db: Session = Depends(get_db)):
    try:
        session = get_session_or_404(db, session_id)
    except AppError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)

    # Collect all folders to remove (root + any sub-sessions)
    paths_to_delete = []
    if session.project_path:
        paths_to_delete.append(session.project_path)

    sub_sessions = (
        db.query(ChatSession)
        .filter(ChatSession.parent_session_id == session_id)
        .all()
    )
    for sub in sub_sessions:
        if sub.project_path:
            paths_to_delete.append(sub.project_path)
        db.delete(sub)

    db.delete(session)
    db.commit()

    # Clean up folders after DB commit so a crash doesn't leave ghost rows
    for path in paths_to_delete:
        try:
            shutil.rmtree(path, ignore_errors=True)
        except Exception:
            pass


@router.patch("/{session_id}/messages", status_code=200)
def update_session_messages(session_id: str, payload: MessagesUpdate, db: Session = Depends(get_db)):
    """Persists the full frontend message array for a session."""
    try:
        session = get_session_or_404(db, session_id)
    except AppError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)
    session.messages_json = json.dumps(payload.messages)
    db.commit()
    return {"ok": True}


@router.get("/{session_id}/progress")
async def stream_progress(session_id: str):
    """
    Server-Sent Events endpoint scoped to a specific session.
    Streams progress updates until the task is complete or errors out.
    """
    async def event_generator():
        terminal_statuses = {"complete", "error"}
        while True:
            state = progress_store.get(
                session_id,
                {
                    "session_id": session_id,
                    "status": "pending",
                    "message": "Waiting for agent to start...",
                    "step": 0,
                    "total": 0,
                },
            )
            yield f"data: {json.dumps(state)}\n\n"

            if state.get("status") in terminal_statuses:
                break

            await asyncio.sleep(0.5)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )