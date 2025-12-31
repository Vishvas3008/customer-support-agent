from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import os
from pathlib import Path
from dotenv import load_dotenv

from database import get_db, init_db
from models import ChatRequest, ChatResponse, ConversationResponse, MessageResponse
from db_service import DatabaseService
from gemini_service import ChatService

# Load environment variables from server directory
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)
# Also try loading from root directory (for flexibility)
load_dotenv()

app = FastAPI(title="Lumina Support API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()
    # Check if GEMINI_API_KEY is set
    api_key = "AIzaSyBfVeUyOi3Py6JL5B3pDGZKimGyK6c6kMg" or os.getenv("GEMINI_API_KEY") or os.getenv("API_KEY")
    if not api_key:
        print("WARNING: GEMINI_API_KEY environment variable is not set!")
        print("Please create a .env file in the server/ directory with:")
        print("GEMINI_API_KEY=your-api-key-here")
        print("Get your API key from: https://aistudio.google.com/app/apikey")

# Health check endpoint
@app.get("/")
async def root():
    return {"message": "Lumina Support API is running in python 1"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

# Chat endpoint
@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    """
    Send a message and get AI response.
    Creates a new conversation if sessionId is not provided.
    """
    try:
        db_service = DatabaseService(db)
        chat_service = ChatService(db_service)
        
        response = await chat_service.send_message(
            text=request.message,
            session_id=request.sessionId
        )
        
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get all conversations
@app.get("/api/conversations", response_model=list[ConversationResponse])
async def get_conversations(db: Session = Depends(get_db)):
    """Get all conversations."""
    try:
        db_service = DatabaseService(db)
        conversations = db_service.get_conversations()
        return conversations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get messages for a conversation
@app.get("/api/conversations/{session_id}/messages", response_model=list[MessageResponse])
async def get_messages(session_id: str, db: Session = Depends(get_db)):
    """Get all messages for a specific conversation."""
    try:
        db_service = DatabaseService(db)
        messages = db_service.get_messages_by_session(session_id)
        return messages
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Delete a conversation
@app.delete("/api/conversations/{session_id}")
async def delete_conversation(session_id: str, db: Session = Depends(get_db)):
    """Delete a conversation and all its messages."""
    try:
        db_service = DatabaseService(db)
        db_service.delete_conversation(session_id)
        return {"message": "Conversation deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)


