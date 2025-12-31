from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
from database import ConversationModel, MessageModel
from models import ConversationResponse, MessageResponse
from typing import List

class DatabaseService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_conversations(self) -> List[ConversationResponse]:
        """Get all conversations, ordered by creation date (newest first)."""
        conversations = self.db.query(ConversationModel).order_by(
            desc(ConversationModel.created_at)
        ).all()
        
        return [
            ConversationResponse(
                id=conv.id,
                title=conv.title,
                createdAt=conv.created_at,
                lastMessage=conv.last_message or ""
            )
            for conv in conversations
        ]
    
    def get_messages_by_session(self, session_id: str) -> List[MessageResponse]:
        """Get all messages for a specific conversation."""
        messages = self.db.query(MessageModel).filter(
            MessageModel.conversation_id == session_id
        ).order_by(MessageModel.timestamp).all()
        
        return [
            MessageResponse(
                id=msg.id,
                conversationId=msg.conversation_id,
                sender=msg.sender,
                text=msg.text,
                timestamp=msg.timestamp
            )
            for msg in messages
        ]
    
    def save_message(self, message: MessageResponse):
        """Save a message to the database."""
        # Check if message already exists
        existing = self.db.query(MessageModel).filter(
            MessageModel.id == message.id
        ).first()
        
        if existing:
            # Update existing message
            existing.text = message.text
            existing.timestamp = message.timestamp
        else:
            # Create new message
            db_message = MessageModel(
                id=message.id,
                conversation_id=message.conversationId,
                sender=message.sender,
                text=message.text,
                timestamp=message.timestamp
            )
            self.db.add(db_message)
        
        # Update conversation's last message
        conv = self.db.query(ConversationModel).filter(
            ConversationModel.id == message.conversationId
        ).first()
        
        if conv:
            conv.last_message = message.text
        
        self.db.commit()
    
    def create_conversation(self, id: str, title: str) -> ConversationResponse:
        """Create a new conversation."""
        # Check if conversation already exists
        existing = self.db.query(ConversationModel).filter(
            ConversationModel.id == id
        ).first()
        
        if existing:
            return ConversationResponse(
                id=existing.id,
                title=existing.title,
                createdAt=existing.created_at,
                lastMessage=existing.last_message or ""
            )
        
        new_conv = ConversationModel(
            id=id,
            title=title,
            created_at=int(datetime.now().timestamp() * 1000),  # Milliseconds
            last_message=""
        )
        self.db.add(new_conv)
        self.db.commit()
        self.db.refresh(new_conv)
        
        return ConversationResponse(
            id=new_conv.id,
            title=new_conv.title,
            createdAt=new_conv.created_at,
            lastMessage=new_conv.last_message or ""
        )
    
    def delete_conversation(self, id: str):
        """Delete a conversation and all its messages."""
        # Delete all messages first
        self.db.query(MessageModel).filter(
            MessageModel.conversation_id == id
        ).delete()
        
        # Delete conversation
        self.db.query(ConversationModel).filter(
            ConversationModel.id == id
        ).delete()
        
        self.db.commit()

