from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App
    app_title: str = "AI Software Engineer API"
    app_version: str = "1.0.0"
    debug: bool = False

    # Database
    database_url: str

    # Groq / LLM
    groq_api_key: str
    groq_model: str = "openai/gpt-oss-120b"

    # CORS
    allowed_origins: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Projects
    projects_base: Path = Path.cwd() / "MY_PROJECTS"

    # Rate limiting (Groq free tier)
    min_delay_seconds: int = 120

    # Agent
    default_recursion_limit: int = 100
    max_recursion_limit: int = 200

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()