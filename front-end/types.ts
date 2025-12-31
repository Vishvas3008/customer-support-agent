
export type Sender = 'user' | 'ai';

export interface Message {
  id: string;
  conversationId: string;
  sender: Sender;
  text: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  createdAt: number;
  lastMessage: string; // Matches backend - always present, can be empty string
  title: string;
}

export interface ChatResponse {
  reply: string;
  sessionId: string;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
}
