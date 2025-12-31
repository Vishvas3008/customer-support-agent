from pydantic import BaseModel
from typing import Optional

class ChatRequest(BaseModel):
    message: str
    sessionId: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    sessionId: str

class MessageResponse(BaseModel):
    id: str
    conversationId: str
    sender: str  # 'user' or 'ai'
    text: str
    timestamp: int

class ConversationResponse(BaseModel):
    id: str
    title: str
    createdAt: int
    lastMessage: str = ""


