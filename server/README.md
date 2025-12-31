# Lumina Support FastAPI Server

A FastAPI backend server with SQLite database that provides the same functionality as the frontend service modules.

## Features

- RESTful API endpoints for chat functionality
- SQLite database for persistent storage
- Gemini AI integration for customer support
- CORS enabled for frontend integration

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set environment variables:**
   Create a `.env` file in the `server/` directory (or use the root `.env.local`):
   ```
   GEMINI_API_KEY=your-api-key-here
   ```

3. **Run the server:**
   ```bash
   python main.py
   ```
   
   Or using uvicorn directly:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

The server will start on `http://localhost:8000`

## API Endpoints

### POST `/api/chat`
Send a message and get AI response.

**Request Body:**
```json
{
  "message": "Hello, I need help with my order",
  "sessionId": "sess_1234567890" // optional
}
```

**Response:**
```json
{
  "reply": "Hello! I'd be happy to help...",
  "sessionId": "sess_1234567890"
}
```

### GET `/api/conversations`
Get all conversations.

**Response:**
```json
[
  {
    "id": "sess_1234567890",
    "title": "Hello, I need help...",
    "createdAt": 1234567890000,
    "lastMessage": "Thank you for your help!"
  }
]
```

### GET `/api/conversations/{session_id}/messages`
Get all messages for a specific conversation.

**Response:**
```json
[
  {
    "id": "msg_u_1234567890",
    "conversationId": "sess_1234567890",
    "sender": "user",
    "text": "Hello",
    "timestamp": 1234567890000
  },
  {
    "id": "msg_a_1234567891",
    "conversationId": "sess_1234567890",
    "sender": "ai",
    "text": "Hello! How can I help?",
    "timestamp": 1234567891000
  }
]
```

### DELETE `/api/conversations/{session_id}`
Delete a conversation and all its messages.

**Response:**
```json
{
  "message": "Conversation deleted successfully"
}
```

## Database

The SQLite database file (`lumina_support.db`) will be created automatically in the `server/` directory when you first run the application.

## Integration with Frontend

To use this API with your React frontend, update your service files to make HTTP requests to `http://localhost:8000/api/` instead of using localStorage.


