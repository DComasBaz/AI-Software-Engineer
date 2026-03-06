from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from core.config import settings


class ProjectCreateRequest(BaseModel):
    prompt: str = Field(..., min_length=10, description="Description of the project to build")
    recursion_limit: int = Field(
        default=settings.default_recursion_limit,
        ge=1,
        le=settings.max_recursion_limit,
        description="Max steps for the agent graph",
    )
    existing_session_id: Optional[str] = Field(
        None, description="Pass an existing session ID to modify that project"
    )

    @field_validator("prompt")
    @classmethod
    def prompt_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("prompt cannot be blank")
        return v.strip()


class ProjectCreateResponse(BaseModel):
    session_id: str
    status: str
    message: str


class SessionResponse(BaseModel):
    id: str
    prompt: str
    output: Optional[str]
    status: str
    download_ready: bool
    project_path: Optional[str]
    messages_json: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class ProgressResponse(BaseModel):
    session_id: str
    status: str
    message: str
    step: int
    total: int