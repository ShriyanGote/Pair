# app/api/routes/chat_routes.py
from fastapi import WebSocket, WebSocketDisconnect, APIRouter
from typing import Dict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.db.database import SessionLocal
from app.models.model import Message

import logging
logger = logging.getLogger("uvicorn.error")

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

connected_users: Dict[int, WebSocket] = {}

@router.websocket("/ws/chat/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    print("ws endpoint got hit")
    await websocket.accept()  # <-- IMPORTANT
    connected_users[user_id] = websocket
    logger.info("message endpoint is hit")

    try:
        while True:
            data = await websocket.receive_json()
            recipient_id = data["to"]
            message_text = data["message"]

            logger.info(f"Saving message: {user_id} -> {recipient_id}: {message_text}")

            # Save to DB
            db = SessionLocal()
            message = Message(sender_id=user_id, receiver_id=recipient_id, content=message_text)
            db.add(message)
            db.commit()
            db.close()

            # Send message to recipient if connected
            if recipient_id in connected_users:
                await connected_users[recipient_id].send_json({
                    "from": user_id,
                    "message": message_text
                })

            # Echo to sender
            await websocket.send_json({
                "from": user_id,
                "message": message_text
            })

    except WebSocketDisconnect:
        del connected_users[user_id]



@router.post("/messages/")
def store_message(sender_id: int, receiver_id: int, content: str, db: Session = Depends(get_db)):
    message = Message(sender_id=sender_id, receiver_id=receiver_id, content=content)
    db.add(message)
    db.commit()
    return {"status": "stored"}

@router.get("/messages/{user1_id}/{user2_id}")
def get_conversation(user1_id: int, user2_id: int, db: Session = Depends(get_db)):
    messages = db.query(Message).filter(
        or_(
            and_(Message.sender_id == user1_id, Message.receiver_id == user2_id),
            and_(Message.sender_id == user2_id, Message.receiver_id == user1_id)
        )
    ).order_by(Message.timestamp).all()

    return [
        {
            "from": m.sender_id,
            "to": m.receiver_id,
            "message": m.content,
            "timestamp": m.timestamp.isoformat(),
        }
        for m in messages
    ]