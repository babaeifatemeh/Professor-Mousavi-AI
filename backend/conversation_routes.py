from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from database import engine
from models import Conversation, Message

router = APIRouter(tags=["Conversations"])


class SaveMessageRequest(BaseModel):
    user_id: int
    question: str
    answer: str
    conversation_id: int | None = None


@router.post("/conversations/save")
def save_conversation_message(request: SaveMessageRequest):
    with Session(engine) as session:
        conversation = None

        if request.conversation_id:
            conversation = session.get(Conversation, request.conversation_id)

        if not conversation:
            conversation = Conversation(
                user_id=request.user_id,
                title=request.question[:50],
            )
            session.add(conversation)
            session.commit()
            session.refresh(conversation)

        session.add(Message(
            conversation_id=conversation.id,
            role="user",
            content=request.question,
        ))

        session.add(Message(
            conversation_id=conversation.id,
            role="assistant",
            content=request.answer,
        ))

        session.commit()

        return {
            "message": "گفتگو ذخیره شد.",
            "conversation_id": conversation.id,
        }


@router.get("/conversations/user/{user_id}")
def user_conversations(user_id: int):
    with Session(engine) as session:
        conversations = session.exec(
            select(Conversation)
            .where(Conversation.user_id == user_id)
            .order_by(Conversation.created_at.desc())
        ).all()

    return {
        "conversations": [
            {
                "id": item.id,
                "title": item.title,
                "created_at": item.created_at,
            }
            for item in conversations
        ]
    }


@router.get("/conversations/{conversation_id}/messages")
def conversation_messages(conversation_id: int):
    with Session(engine) as session:
        conversation = session.get(Conversation, conversation_id)

        if not conversation:
            raise HTTPException(status_code=404, detail="گفتگو پیدا نشد.")

        messages = session.exec(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at)
        ).all()

    return {
        "conversation": {
            "id": conversation.id,
            "title": conversation.title,
            "user_id": conversation.user_id,
        },
        "messages": [
            {
                "id": message.id,
                "role": message.role,
                "content": message.content,
                "created_at": message.created_at,
            }
            for message in messages
        ],
    }


@router.get("/admin/conversations")
def admin_conversations():
    with Session(engine) as session:
        conversations = session.exec(
            select(Conversation).order_by(Conversation.created_at.desc())
        ).all()

    return {
        "conversations": [
            {
                "id": item.id,
                "user_id": item.user_id,
                "title": item.title,
                "created_at": item.created_at,
            }
            for item in conversations
        ]
    }