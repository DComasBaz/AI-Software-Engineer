"""
Tests for services/project_service.py

Run with:
    uv run pytest tests/test_project_service.py -v
"""
import zipfile
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest

from services.project_service import (
    build_project_zip,
    get_session_or_404,
    prepare_modification_session,
    prepare_new_session,
    run_agent_task,
)
from core.exceptions import ProjectNotFoundError, SessionNotFoundError


# ---------------------------------------------------------------------------
# Helpers / Fixtures
# ---------------------------------------------------------------------------

def _make_session(**kwargs) -> SimpleNamespace:
    """
    Returns a plain SimpleNamespace that mimics a ChatSession row.
    Using ChatSession.__new__() bypasses SQLAlchemy's mapper initialisation
    and causes AttributeError when setting attributes — SimpleNamespace avoids
    that entirely for unit tests that don't touch the real DB.
    """
    defaults = dict(
        id="sess-001",
        prompt="build a todo app",
        status="pending",
        output=None,
        download_ready=0,
        project_path=None,
        messages_json=None,
    )
    defaults.update(kwargs)
    return SimpleNamespace(**defaults)


@pytest.fixture
def mock_db():
    return MagicMock()


# ---------------------------------------------------------------------------
# get_session_or_404
# ---------------------------------------------------------------------------

class TestGetSessionOr404:
    def test_returns_session_when_found(self, mock_db):
        session = _make_session()
        mock_db.query.return_value.filter.return_value.first.return_value = session
        result = get_session_or_404(mock_db, "sess-001")
        assert result is session

    def test_raises_when_not_found(self, mock_db):
        mock_db.query.return_value.filter.return_value.first.return_value = None
        with pytest.raises(SessionNotFoundError):
            get_session_or_404(mock_db, "missing-id")


# ---------------------------------------------------------------------------
# prepare_new_session
# ---------------------------------------------------------------------------

class TestPrepareNewSession:
    def test_creates_session_and_project_path(self, mock_db, tmp_path):
        session = _make_session(id="new-sess")

        mock_db.add = MagicMock()
        mock_db.commit = MagicMock()
        mock_db.refresh = MagicMock()

        with patch("services.project_service.init_project_root") as mock_init, \
             patch("services.project_service.ChatSession", return_value=session):
            mock_init.return_value = tmp_path / "new-sess"
            (tmp_path / "new-sess").mkdir()

            result_session, result_path = prepare_new_session(mock_db, "build a blog")

        assert result_session is session
        assert mock_db.add.called
        assert mock_db.commit.called


# ---------------------------------------------------------------------------
# prepare_modification_session
# ---------------------------------------------------------------------------

class TestPrepareModificationSession:
    def test_updates_existing_session(self, mock_db, tmp_path):
        project_dir = tmp_path / "proj"
        project_dir.mkdir()
        session = _make_session(id="exist-sess", project_path=str(project_dir))

        mock_db.query.return_value.filter.return_value.first.return_value = session
        mock_db.commit = MagicMock()
        mock_db.refresh = MagicMock()

        with patch("services.project_service.set_project_root"):
            result_session, result_path = prepare_modification_session(
                mock_db, "add dark mode", "exist-sess"
            )

        assert result_session.prompt == "add dark mode"
        assert result_session.status == "pending"
        assert result_session.output is None
        assert result_session.download_ready == 0

    def test_raises_if_project_path_missing(self, mock_db):
        session = _make_session(id="sess-no-path", project_path=None)
        mock_db.query.return_value.filter.return_value.first.return_value = session

        with pytest.raises(ProjectNotFoundError):
            prepare_modification_session(mock_db, "change something", "sess-no-path")

    def test_raises_if_project_dir_not_exist(self, mock_db, tmp_path):
        session = _make_session(
            id="sess-missing-dir",
            project_path=str(tmp_path / "ghost_folder"),
        )
        mock_db.query.return_value.filter.return_value.first.return_value = session

        with pytest.raises(ProjectNotFoundError):
            prepare_modification_session(mock_db, "change something", "sess-missing-dir")


# ---------------------------------------------------------------------------
# build_project_zip
# ---------------------------------------------------------------------------

class TestBuildProjectZip:
    def test_creates_zip(self, tmp_path):
        project_dir = tmp_path / "myproject"
        project_dir.mkdir()
        (project_dir / "main.py").write_text("print('hello')")
        (project_dir / "README.md").write_text("# README")

        session = _make_session(project_path=str(project_dir))
        zip_path = build_project_zip(session)

        assert zip_path.exists()
        assert zip_path.suffix == ".zip"
        with zipfile.ZipFile(zip_path) as zf:
            names = zf.namelist()
        assert any("main.py" in n for n in names)
        assert any("README.md" in n for n in names)

    def test_raises_no_project_path(self):
        session = _make_session(project_path=None)
        with pytest.raises(ProjectNotFoundError):
            build_project_zip(session)

    def test_raises_missing_directory(self, tmp_path):
        session = _make_session(project_path=str(tmp_path / "does_not_exist"))
        with pytest.raises(ProjectNotFoundError):
            build_project_zip(session)

    def test_overwrites_existing_zip(self, tmp_path):
        project_dir = tmp_path / "proj"
        project_dir.mkdir()
        (project_dir / "a.txt").write_text("v1")

        session = _make_session(id="s1", project_path=str(project_dir))
        zip1 = build_project_zip(session)

        (project_dir / "a.txt").write_text("v2")
        zip2 = build_project_zip(session)

        assert zip1 == zip2  # same path
        with zipfile.ZipFile(zip2) as zf:
            content = zf.read(zf.namelist()[0]).decode()
        assert content == "v2"


# ---------------------------------------------------------------------------
# run_agent_task
# ---------------------------------------------------------------------------

class TestRunAgentTask:
    def test_happy_path_marks_done(self, tmp_path):
        session = _make_session(id="s-run")
        db = MagicMock()
        db.query.return_value.filter.return_value.first.return_value = session
        db_factory = MagicMock(return_value=db)

        with patch("services.project_service.init_progress"), \
             patch("services.project_service.set_project_root"), \
             patch("services.project_service.update_progress"), \
             patch("services.project_service.agent") as mock_agent:
            mock_agent.invoke.return_value = {"result": "ok"}
            run_agent_task(
                session_id="s-run",
                prompt="build something",
                recursion_limit=50,
                project_path=tmp_path,
                db_session_factory=db_factory,
            )

        assert session.status == "done"
        assert session.download_ready == 1

    def test_exception_marks_error(self, tmp_path):
        session = _make_session(id="s-err")
        db = MagicMock()
        db.query.return_value.filter.return_value.first.return_value = session
        db_factory = MagicMock(return_value=db)

        with patch("services.project_service.init_progress"), \
             patch("services.project_service.set_project_root"), \
             patch("services.project_service.update_progress"), \
             patch("services.project_service.agent") as mock_agent:
            mock_agent.invoke.side_effect = RuntimeError("LLM exploded")
            run_agent_task(
                session_id="s-err",
                prompt="build something",
                recursion_limit=50,
                project_path=tmp_path,
                db_session_factory=db_factory,
            )

        assert session.status == "error"
        assert "LLM exploded" in session.output
