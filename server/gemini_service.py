import os
import google.generativeai as genai
from typing import Optional
import time
from models import ChatResponse, MessageResponse
from constants import SYSTEM_PROMPT
from db_service import DatabaseService

class ChatService:
    def __init__(self, db_service: DatabaseService):
        self.db_service = db_service
        api_key = "AIzaSyBfVeUyOi3Py6JL5B3pDGZKimGyK6c6kMg" or os.getenv("GEMINI_API_KEY") or os.getenv("API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set")
        
        genai.configure(api_key=api_key)
    
    async def send_message(
        self, 
        text: str, 
        session_id: Optional[str] = None
    ) -> ChatResponse:
        """
        Send a message and get AI response.
        Creates a new conversation if sessionId is not provided.
        """
        trimmed_message = text.strip()
        
        if not trimmed_message:
            raise ValueError("Message cannot be empty.")
        
        if len(trimmed_message) > 2000:
            raise ValueError("Message is too long. Please limit to 2000 characters.")
        
        # Generate session ID if not provided
        actual_session_id = session_id
        if not actual_session_id:
            current_time = int(time.time() * 1000)
            actual_session_id = f"sess_{current_time}"
            self.db_service.create_conversation(
                actual_session_id, 
                trimmed_message[:30] + "..."
            )
        
        # Save user message
        current_time = int(time.time() * 1000)
        user_msg = MessageResponse(
            id=f"msg_u_{current_time}",
            conversationId=actual_session_id,
            sender="user",
            text=trimmed_message,
            timestamp=current_time
        )
        self.db_service.save_message(user_msg)
        
        try:
            # Get conversation history
            history = self.db_service.get_messages_by_session(actual_session_id)
            
            # Prepare chat history for Gemini API (exclude the last message which is the current user message)
            chat_history = []
            for msg in history[:-1]:
                if msg.sender == "user":
                    chat_history.append({"role": "user", "parts": [msg.text]})
                else:
                    chat_history.append({"role": "model", "parts": [msg.text]})
            
            # Create model with system instruction
            # Use gemini-1.5-flash as default (works with free tier)
            # For paid tier, you can change to 'gemini-2.0-flash-exp' or 'gemini-1.5-pro'
            model = genai.GenerativeModel(
                'gemini-1.5-flash',
                system_instruction=SYSTEM_PROMPT
            )
            
            # Start chat session with history if there's any
            if chat_history:
                chat = model.start_chat(history=chat_history)
                response = chat.send_message(
                    trimmed_message,
                    generation_config={
                        "temperature": 0.7,
                        "max_output_tokens": 1000,
                    }
                )
            else:
                # First message in conversation
                response = model.generate_content(
                    trimmed_message,
                    generation_config={
                        "temperature": 0.7,
                        "max_output_tokens": 1000,
                    }
                )

            reply = response.text if response.text else "I'm sorry, I couldn't generate a response. Please try again."
            
            # Save AI response
            ai_time = int(time.time() * 1000)
            ai_msg = MessageResponse(
                id=f"msg_a_{ai_time}",
                conversationId=actual_session_id,
                sender="ai",
                text=reply,
                timestamp=ai_time
            )
            self.db_service.save_message(ai_msg)
            return ChatResponse(
                reply=reply,
                sessionId=actual_session_id
            )
            
        except Exception as error:
            error_msg = str(error)
            print(f"Gemini API Error: {error_msg}")  # Debug log
            
            if "API_KEY" in error_msg or "api_key" in error_msg or "authentication" in error_msg.lower():
                raise ValueError("System Error: Invalid configuration. Please check the API key.")
            
            # Handle quota/rate limit errors
            if "429" in error_msg or "quota" in error_msg.lower() or "rate limit" in error_msg.lower():
                raise ValueError("API quota exceeded. The free tier has limited requests. Please wait a moment and try again, or check your API plan at https://ai.google.dev/pricing")
            
            # Include the actual error message for debugging
            raise ValueError(f"The AI agent is currently unavailable: {error_msg}. Please try again in a moment.")

