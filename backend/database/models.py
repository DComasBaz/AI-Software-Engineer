import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Index, Integer, String, Text

from database.database import Base


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    prompt = Column(Text, nullable=False)
    output = Column(Text, nullable=True)
    status = Column(String(16), nullable=False, default="pending")  # pending | running | done | error
    download_ready = Column(Integer, nullable=False, default=0)
    project_path = Column(String, nullable=True)
    messages_json = Column(Text, nullable=True)  # JSON array of {type, text, downloadReady}
    # null = root session (shown in history); non-null = modification run (hidden from history)
    parent_session_id = Column(String, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        Index("ix_chat_sessions_created_at", "created_at"),
        Index("ix_chat_sessions_status", "status"),
    )

    def __repr__(self) -> str:
        return f"<ChatSession id={self.id!r} status={self.status!r}>"