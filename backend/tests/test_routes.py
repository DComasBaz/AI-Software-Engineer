"""
Tests for API routes: sessions.py and projects.py

Uses a real PostgreSQL test database (see conftest.py / TEST_DATABASE_URL).

Run with:
    uv run pytest tests/test_routes.py -v
"""
import json
import zipfile
from unittest.mock import patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from api.routers.sessions import router as sessions_router
from api.routers.projects import router as projects_router
from api.deps import get_db
from database.models import ChatSession

# ---------------------------------------------------------------------------
# App wired up for tests
# ---------------------------------------------------------------------------

app = FastAPI()
app.include_router(sessions_router)
app.include_router(projects_router)


@pytest.fixture()
def client(db_session):
    """TestClient backed by the transactional test session from conftest."""
    app.dependency_overrides[get_db] = lambda: db_session
    yield TestClient(app)
    app.dependency_overrides.clear()


def _insert_session(db, **kwargs) -> ChatSession:
    """Helper: insert a real ChatSession row into the test DB."""
    defaults = dict(
        prompt="build something cool",
        status="done",
        output="completed",
        download_ready=1,
        project_path="/tmp/proj",
        messages_json=None,
    )
    defaults.update(kwargs)
    session = ChatSession(**defaults)
    db.add(session)
    db.flush()  # gets the auto-generated id without a full commit
    return session


# ===========================================================================
# Sessions router
# ===========================================================================

class TestListSessions:
    def test_returns_list(self, client, db_session):
        _insert_session(db_session, prompt="first project")
        _insert_session(db_session, prompt="second project")
        resp = client.get("/sessions")
        assert resp.status_code == 200
        assert len(resp.json()) >= 2

    def test_empty_list(self, client, db_session):
        resp = client.get("/sessions")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


class TestGetSession:
    def test_found(self, client, db_session):
        session = _insert_session(db_session)
        resp = client.get(f"/sessions/{session.id}")
        assert resp.status_code == 200
        assert resp.json()["id"] == session.id

    def test_not_found(self, client):
        resp = client.get("/sessions/00000000-0000-0000-0000-000000000000")
        assert resp.status_code == 404


class TestDeleteSession:
    def test_delete_success(self, client, db_session):
        session = _insert_session(db_session)
        resp = client.delete(f"/sessions/{session.id}")
        assert resp.status_code == 204
        # Verify it's gone
        assert client.get(f"/sessions/{session.id}").status_code == 404

    def test_delete_not_found(self, client):
        resp = client.delete("/sessions/00000000-0000-0000-0000-000000000000")
        assert resp.status_code == 404


class TestUpdateSessionMessages:
    def test_updates_messages(self, client, db_session):
        session = _insert_session(db_session)
        messages = [{"type": "userMsg", "text": "hello"}]
        resp = client.patch(
            f"/sessions/{session.id}/messages",
            json={"messages": messages},
        )
        assert resp.status_code == 200
        assert resp.json() == {"ok": True}
        db_session.refresh(session)
        assert json.loads(session.messages_json) == messages

    def test_invalid_body_rejected(self, client, db_session):
        session = _insert_session(db_session)
        resp = client.patch(
            f"/sessions/{session.id}/messages",
            json={"wrong_key": []},
        )
        assert resp.status_code == 422

    def test_session_not_found(self, client):
        resp = client.patch(
            "/sessions/00000000-0000-0000-0000-000000000000/messages",
            json={"messages": []},
        )
        assert resp.status_code == 404


class TestStreamProgress:
    def test_progress_endpoint_streams(self, client):
        from agent.graph import progress_store
        progress_store["stream-test"] = {
            "session_id": "stream-test",
            "status": "complete",
            "message": "Done",
            "step": 3,
            "total": 3,
        }
        resp = client.get("/sessions/stream-test/progress")
        assert resp.status_code == 200
        assert "text/event-stream" in resp.headers["content-type"]


# ===========================================================================
# Projects router
# ===========================================================================

class TestCreateProject:
    def test_new_project_accepted(self, client, db_session, tmp_path):
        session = _insert_session(db_session, status="pending")
        with (
            patch("api.routers.projects.prepare_new_session", return_value=(session, tmp_path)),
            patch("api.routers.projects.run_agent_task"),
        ):
            resp = client.post(
                "/projects",
                json={"prompt": "build a REST API for a bookstore"},
            )
        assert resp.status_code == 202
        assert resp.json()["session_id"] == session.id
        assert resp.json()["status"] == "pending"

    def test_modification_project_accepted(self, client, db_session, tmp_path):
        session = _insert_session(db_session, status="pending")
        with (
            patch(
                "api.routers.projects.prepare_modification_session",
                return_value=(session, tmp_path),
            ),
            patch("api.routers.projects.run_agent_task"),
        ):
            resp = client.post(
                "/projects",
                json={
                    "prompt": "add a search endpoint to the project",
                    "existing_session_id": session.id,
                },
            )
        assert resp.status_code == 202
        assert resp.json()["session_id"] == session.id

    def test_short_prompt_rejected(self, client):
        resp = client.post("/projects", json={"prompt": "hi"})
        assert resp.status_code == 422

    def test_blank_prompt_rejected(self, client):
        resp = client.post("/projects", json={"prompt": "          "})
        assert resp.status_code == 422

    def test_service_error_returns_http_error(self, client):
        from core.exceptions import AppError
        with patch(
            "api.routers.projects.prepare_new_session",
            side_effect=AppError("bad request", 400),
        ):
            resp = client.post(
                "/projects",
                json={"prompt": "build a valid project prompt here"},
            )
        assert resp.status_code == 400


class TestDownloadProject:
    def test_download_returns_zip(self, client, db_session, tmp_path):
        # Write a real zip so FileResponse is happy
        zip_path = tmp_path / "proj.zip"
        with zipfile.ZipFile(zip_path, "w") as zf:
            zf.writestr("main.py", "print('hello')")

        session = _insert_session(db_session)
        with patch("api.routers.projects.build_project_zip", return_value=zip_path):
            resp = client.get(f"/projects/{session.id}/download")

        assert resp.status_code == 200
        assert resp.headers["content-type"] == "application/zip"

    def test_download_not_found(self, client):
        resp = client.get("/projects/00000000-0000-0000-0000-000000000000/download")
        assert resp.status_code == 404