"""
Application entry point.

Run with:
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import projects, sessions
from core.config import settings
from core.logger import configure_logging, get_logger
from database.database import Base, engine

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Startup
    configure_logging()
    logger.info("Starting %s v%s", settings.app_title, settings.app_version)
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown
    logger.info("Shutting down")


app = FastAPI(
    title=settings.app_title,
    version=settings.app_version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers (versioned under /api/v1)
# ---------------------------------------------------------------------------
API_PREFIX = "/api/v1"
app.include_router(projects.router, prefix=API_PREFIX)
app.include_router(sessions.router, prefix=API_PREFIX)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok", "version": settings.app_version}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
    )