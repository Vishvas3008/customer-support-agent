import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { initDb, closeDb } from './database';
import { DatabaseService } from './dbService';
import { ChatService } from './geminiService';
import { ChatRequest, ChatResponse, Conversation, Message } from './types';

// Load environment variables
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });
dotenv.config(); // Also try loading from root directory

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
  origin: '*', // In production, specify your frontend URL
  credentials: true
}));
app.use(express.json());

// Initialize database on startup
initDb();

// Check if GEMINI_API_KEY is set on startup
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
if (!apiKey) {
  console.warn('WARNING: GEMINI_API_KEY environment variable is not set!');
  console.warn('Please create a .env file in the server-node/ directory with:');
  console.warn('GEMINI_API_KEY=your-api-key-here');
  console.warn('Get your API key from: https://aistudio.google.com/app/apikey');
}

// Health check endpoints
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Lumina Support API is running in node' });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy' });
});

// Chat endpoint
app.post('/api/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, sessionId }: ChatRequest = req.body;

    if (!message) {
      return res.status(400).json({ detail: 'Message is required' });
    }

    const dbService = new DatabaseService();
    const chatService = new ChatService(dbService);

    const response: ChatResponse = await chatService.generateAiReply(message, sessionId);
    res.json(response);
  } catch (error: any) {
    const statusCode = error.message.includes('cannot be empty') || 
                      error.message.includes('too long') ||
                      error.message.includes('Invalid configuration') ? 400 : 500;
    res.status(statusCode).json({ detail: error.message });
  }
});

// Get all conversations
app.get('/api/conversations', (req: Request, res: Response, next: NextFunction) => {
  try {
    const dbService = new DatabaseService();
    const conversations: Conversation[] = dbService.getConversations();
    res.json(conversations);
  } catch (error: any) {
    res.status(500).json({ detail: error.message });
  }
});

// Get messages for a conversation
app.get('/api/conversations/:sessionId/messages', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const dbService = new DatabaseService();
    const messages: Message[] = dbService.getMessagesBySession(sessionId);
    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ detail: error.message });
  }
});

// Delete a conversation
app.delete('/api/conversations/:sessionId', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const dbService = new DatabaseService();
    dbService.deleteConversation(sessionId);
    res.json({ message: 'Conversation deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ detail: error.message });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ detail: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  closeDb();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  closeDb();
  process.exit(0);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Lumina Support API running on http://0.0.0.0:${PORT}`);
  console.log(`📚 API docs available at http://localhost:${PORT}`);
});

