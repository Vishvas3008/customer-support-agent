export interface ChatRequest {
  message: string;
  sessionId?: string;
}

export interface ChatResponse {
  reply: string;
  sessionId: string;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  lastMessage: string;
}

// Database models
export interface ConversationModel {
  id: string;
  title: string;
  created_at: number;
  last_message: string | null;
}

export interface MessageModel {
  id: string;
  conversation_id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
}

