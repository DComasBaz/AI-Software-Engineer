from sqlalchemy import create_engine, Column, String, DateTime, Integer, Text
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime
import uuid

engine = create_engine(
    "sqlite:///./chat_history.db",
    connect_args={"check_same_thread": False}
)

Base = declarative_base()
SessionLocal = sessionmaker(bind=engine)


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    prompt = Column(Text, nullable=False)
    output = Column(Text)
    status = Column(String, default="pending")  # pending | done | error
    download_ready = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


Base.metadata.create_all(engine)
