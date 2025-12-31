import { GoogleGenAI } from '@google/genai';
import { STORE_PROFILE, SYSTEM_PROMPT } from './constants';
import { ChatResponse, Message } from './types';
import { DatabaseService } from './dbService';

export class ChatService {
  private ai: GoogleGenAI;
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;

    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    // Initialize new GenAI client
    this.ai = new GoogleGenAI({ apiKey });
  }
  private buildStoreContext(store: typeof STORE_PROFILE): string {
    return `
    STORE INFORMATION:
    Store Name: ${store.name}
    Specialty: ${store.specialty}
    Shipping Policy: ${store.shipping}
    Return Policy: ${store.returns}
    Business Hours: ${store.hours}
    Location: ${store.location}
    `.trim();
  }
  private buildFinalPrompt({storeContext, conversationHistory,userMessage}:{storeContext: string, conversationHistory: string[], userMessage: string}): string[] {
    return [
      storeContext,
      ...conversationHistory,
      userMessage
    ].filter(Boolean);
  }
  async generateAiReply(text: string, sessionId?: string): Promise<ChatResponse> {
    const trimmedMessage = text.trim();

    if (!trimmedMessage) {
      throw new Error('Message cannot be empty.');
    }

    if (trimmedMessage.length > 2000) {
      throw new Error('Message is too long. Please limit to 2000 characters.');
    }

    let actualSessionId = sessionId;
    if (!actualSessionId) {
      actualSessionId = `sess_${Date.now()}`;
      this.dbService.createConversation(
        actualSessionId,
        trimmedMessage.slice(0, 30) + '...'
      );
    }

    const currentTime = Date.now();
    const userMsg: Message = {
      id: `msg_u_${currentTime}`,
      conversationId: actualSessionId,
      sender: 'user',
      text: trimmedMessage,
      timestamp: currentTime
    };

    this.dbService.saveMessage(userMsg);

    try {
      const history = this.dbService.getMessagesBySession(actualSessionId,20);

      // Compose full history text
      const prev_contents: string[] = history.map(msg => {
        return `${msg.sender}: ${msg.text}`;
      });

      const contents = this.buildFinalPrompt({
        storeContext: this.buildStoreContext(STORE_PROFILE), // or we can vectorize the store context
        conversationHistory: prev_contents,
        userMessage: `user: ${trimmedMessage}`
      });
      
      // return {
      //   reply:"reply",
      //   sessionId: actualSessionId
      // };

      // Generate response
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          maxOutputTokens: 1000,
          temperature: 0.7
        }
      });

      const reply = response.text || "I'm sorry, I couldn't generate a response. Please try again.";

      const aiTime = Date.now();
      const aiMsg: Message = {
        id: `msg_a_${aiTime}`,
        conversationId: actualSessionId,
        sender: 'ai',
        text: reply,
        timestamp: aiTime
      };

      this.dbService.saveMessage(aiMsg);

      return {
        reply,
        sessionId: actualSessionId
      };

    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      console.error('GenAI Error:', errorMsg);

      if (errorMsg.toLowerCase().includes('authentication')) {
        throw new Error('System Error: Invalid configuration. Please check the API key.');
      }

      if (errorMsg.includes('429') || errorMsg.toLowerCase().includes('quota')) {
        throw new Error('API quota exceeded. Please try again later.');
      }

      throw new Error(`The AI agent is currently unavailable: ${errorMsg}`);
    }
  }
}
