from typing import Optional
from datetime import datetime

from sqlmodel import SQLModel, Field


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    full_name: str
    email: str = Field(index=True, unique=True)
    password: str

    is_admin: bool = False
    is_active: bool = True


class Conversation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    user_id: int = Field(index=True)
    title: str = "گفتگوی جدید"

    created_at: datetime = Field(default_factory=datetime.utcnow)


class Message(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    conversation_id: int = Field(index=True)
    role: str
    content: str

    created_at: datetime = Field(default_factory=datetime.utcnow)