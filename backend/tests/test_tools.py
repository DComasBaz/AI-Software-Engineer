"""
Tests for agent/tools.py

Run with:
    pytest tests/test_tools.py -v
"""
import pytest
from unittest.mock import patch

# ── Adjust the import path to match your project layout ──────────────────────
from agent.tools import (
    get_current_directory,
    get_project_root,
    init_project_root,
    list_files,
    read_file,
    set_project_root,
    write_file,
    _safe_path,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture()
def tmp_project(tmp_path):
    """Initialise an isolated project root in a temp directory."""
    project = tmp_path / "test_session"
    project.mkdir()
    set_project_root(project)
    return project


# ---------------------------------------------------------------------------
# set_project_root / get_project_root
# ---------------------------------------------------------------------------

class TestProjectRoot:
    def test_set_and_get(self, tmp_path):
        set_project_root(tmp_path)
        assert get_project_root() == tmp_path

    def test_init_creates_directory(self, tmp_path):
        session_id = "abc-123"
        with patch("agent.tools.PROJECTS_BASE", tmp_path):
            result = init_project_root(session_id)
            assert result.exists()
            assert get_project_root() == result


# ---------------------------------------------------------------------------
# _safe_path — path traversal prevention
# ---------------------------------------------------------------------------

class TestSafePath:
    def test_normal_path(self, tmp_project):
        result = _safe_path("src/main.py")
        assert str(result).startswith(str(tmp_project))

    def test_root_path(self, tmp_project):
        result = _safe_path(".")
        assert result == tmp_project.resolve()

    def test_traversal_blocked(self, tmp_project):
        with pytest.raises(ValueError, match="escapes the project root"):
            _safe_path("../../etc/passwd")

    def test_nested_traversal_blocked(self, tmp_project):
        with pytest.raises(ValueError, match="escapes the project root"):
            _safe_path("src/../../../secret")

    def test_absolute_outside_blocked(self, tmp_project):
        with pytest.raises(ValueError, match="escapes the project root"):
            _safe_path("/etc/passwd")


# ---------------------------------------------------------------------------
# write_file tool
# ---------------------------------------------------------------------------

class TestWriteFile:
    def test_write_creates_file(self, tmp_project):
        result = write_file.run({"path": "hello.txt", "content": "world"})
        target = tmp_project / "hello.txt"
        assert target.exists()
        assert target.read_text() == "world"
        assert "OK:" in result

    def test_write_creates_subdirectory(self, tmp_project):
        write_file.run({"path": "a/b/c.py", "content": "# code"})
        assert (tmp_project / "a/b/c.py").exists()

    def test_write_overwrites_existing(self, tmp_project):
        write_file.run({"path": "f.txt", "content": "v1"})
        write_file.run({"path": "f.txt", "content": "v2"})
        assert (tmp_project / "f.txt").read_text() == "v2"

    def test_write_blocks_traversal(self, tmp_project):
        with pytest.raises(ValueError):
            write_file.run({"path": "../../evil.sh", "content": "rm -rf /"})


# ---------------------------------------------------------------------------
# read_file tool
# ---------------------------------------------------------------------------

class TestReadFile:
    def test_read_existing(self, tmp_project):
        (tmp_project / "data.txt").write_text("hello")
        content = read_file.run({"path": "data.txt"})
        assert content == "hello"

    def test_read_missing_returns_empty(self, tmp_project):
        content = read_file.run({"path": "nonexistent.txt"})
        assert content == ""

    def test_read_blocks_traversal(self, tmp_project):
        with pytest.raises(ValueError):
            read_file.run({"path": "../other_project/secret.txt"})


# ---------------------------------------------------------------------------
# list_files tool
# ---------------------------------------------------------------------------

class TestListFiles:
    def test_list_empty_dir(self, tmp_project):
        result = list_files.run({"directory": "."})
        assert result == "No files found."

    def test_list_single_file(self, tmp_project):
        (tmp_project / "app.py").write_text("x")
        result = list_files.run({"directory": "."})
        assert "app.py" in result

    def test_list_nested_files(self, tmp_project):
        (tmp_project / "src").mkdir()
        (tmp_project / "src" / "main.py").write_text("x")
        (tmp_project / "README.md").write_text("y")
        result = list_files.run({"directory": "."})
        assert any(p in result for p in ("src/main.py", "src\\main.py"))
        assert "README.md" in result

    def test_list_non_directory(self, tmp_project):
        (tmp_project / "file.txt").write_text("x")
        result = list_files.run({"directory": "file.txt"})
        assert "ERROR" in result

    def test_list_blocks_traversal(self, tmp_project):
        with pytest.raises(ValueError):
            list_files.run({"directory": "../../"})


# ---------------------------------------------------------------------------
# get_current_directory tool
# ---------------------------------------------------------------------------

class TestGetCurrentDirectory:
    def test_returns_string(self, tmp_project):
        result = get_current_directory.run({})
        assert isinstance(result, str)
        assert str(tmp_project) in result
