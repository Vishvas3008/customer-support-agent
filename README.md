
# AI Live Chat Support Agent

This project is a small AI-powered customer support chat app built as part of the Spur Founding Full-Stack Engineer take-home assignment.

It recreates a simple live chat experience where users can ask questions about a fictional e-commerce store and get helpful, conversational replies from an AI agent powered by a real LLM.

Both the frontend and backend are built with React and Node.js and live together in a single repository for simplicity.


## How to Run Locally

### 1. Clone the repository
```bash
git clone <repo-url>
cd <repo-name>
````

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the backend directory:

```env
GEMINI_API_KEY = your_llm_api_key
```

### 4. Run the application
The project includes root-level npm scripts to make running both the backend and frontend easy.

From the project root:
```bash
npm install
npm run install:all
npm run dev
```
This will:

- Install dependencies for both the backend and frontend
- Start the backend API and frontend app concurrently
- Allow you to use the chat UI while the API runs in parallel

Open the app in your browser:

```
http://localhost:3000
```

---

## Database Setup

* Used **SQLite** for simplicity
* Database tables are created automatically on first run
* No migrations or manual setup required

---

## Architecture Overview

### Backend

* Node.js + TypeScript + Express
* Persists conversations and messages
* LLM integration wrapped in a dedicated service
* Conversation history is limited to avoid repetition

### Frontend

* React + TypeScript
* Simple chat UI with user/AI message separation
* Optimistic UI updates for better UX
* Auto-scroll and input focus handling

---

## LLM Notes

* **Provider:** Google Gemini
* Uses a system prompt defining the AI as a customer support agent
* Store knowledge is injected separately from the main prompt
* Limited conversation history is sent for each request
* Handles API errors (rate limits, invalid keys) gracefully

---

## Trade-offs & Future Improvements

* No authentication or user accounts
* No streaming responses
* No RAG or vector search (store knowledge is static)

If I had more time:

* Add embeddings-based retrieval for store knowledge
* Add streaming responses / typing indicator
* Improve conversation state handling
* Added agents which can retrive data from database

---

## Deployed URL

```
<add deployed URL here>
```
---
