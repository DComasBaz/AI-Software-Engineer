"""
Shared pytest fixtures and configuration.

TEST_DATABASE_URL is read from your .env file automatically —
no need to export it manually.

The fixture creates all tables once per session and rolls back every
individual test, so the DB stays clean without recreating tables each time.
"""
import os
import pathlib
import sys

import pytest
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# ---------------------------------------------------------------------------
# Project root on sys.path + load .env
# ---------------------------------------------------------------------------
REPO_ROOT = pathlib.Path(__file__).parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

load_dotenv(REPO_ROOT / ".env")  # picks up TEST_DATABASE_URL from .env

# ---------------------------------------------------------------------------
# PostgreSQL test database URL
# ---------------------------------------------------------------------------
TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL")
if not TEST_DATABASE_URL:
    raise RuntimeError(
        "TEST_DATABASE_URL is not set. Add it to your .env file:\n"
        "TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/myapp_test"
    )


# ---------------------------------------------------------------------------
# DB fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def db_engine():
    """Creates all tables once; drops them when the session ends."""
    from database.database import Base

    engine = create_engine(TEST_DATABASE_URL, pool_pre_ping=True)
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture()
def db_session(db_engine):
    """
    Each test gets a transaction that is rolled back on teardown,
    keeping the DB clean without recreating tables.
    """
    connection = db_engine.connect()
    transaction = connection.begin()
    session_factory  = sessionmaker(bind=connection, autocommit=False, autoflush=False)
    session = session_factory ()
    nested = connection.begin_nested()  # savepoint

    yield session

    session.close()
    if nested.is_active:
        nested.rollback()
    transaction.rollback()
    connection.close()


# ---------------------------------------------------------------------------
# Isolate ContextVar project root between tests
# ---------------------------------------------------------------------------
@pytest.fixture(autouse=True)
def reset_project_root():
    """Prevents one test's set_project_root() from bleeding into the next."""
    try:
        from agent.tools import set_project_root, PROJECTS_BASE
        yield
        set_project_root(PROJECTS_BASE)
    except ImportError:
        yield