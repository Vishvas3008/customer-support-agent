import { GoogleGenerativeAI } from '@google/generative-ai';
import { SYSTEM_PROMPT } from './constants';
import { ChatResponse, Message } from './types';
import { DatabaseService } from './dbService';

export class ChatService {
  private genAI: GoogleGenerativeAI;
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
    
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async sendMessage(text: string, sessionId?: string): Promise<ChatResponse> {
    const trimmedMessage = text.trim();

    if (!trimmedMessage) {
      throw new Error('Message cannot be empty.');
    }

    if (trimmedMessage.length > 2000) {
      throw new Error('Message is too long. Please limit to 2000 characters.');
    }

    // Generate session ID if not provided
    let actualSessionId = sessionId;
    if (!actualSessionId) {
      actualSessionId = `sess_${Date.now()}`;
      this.dbService.createConversation(
        actualSessionId,
        trimmedMessage.slice(0, 30) + '...'
      );
    }

    // Save user message
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
      // Get conversation history
      const history = this.dbService.getMessagesBySession(actualSessionId);

      // Prepare chat history for Gemini API (exclude the last message which is the current user message)
      const chatHistory = history.slice(0, -1).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model' as const,
        parts: [{ text: msg.text }]
      }));

      // Create model with system instruction
      // Use gemini-1.5-flash as default (works with free tier)
      // For paid tier, you can change to 'gemini-2.0-flash-exp' or 'gemini-1.5-pro'
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.0-pro',
        systemInstruction: SYSTEM_PROMPT
      });

      let response;
      
      // Start chat session with history if there's any
      if (chatHistory.length > 0) {
        const chat = model.startChat({
          history: chatHistory
        });
        response = await chat.sendMessage(trimmedMessage, {
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000
          }
        });
      } else {
        // First message in conversation
        response = await model.generateContent(trimmedMessage, {
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000
          }
        });
      }

      const reply = response.response.text() || "I'm sorry, I couldn't generate a response. Please try again.";

      // Save AI response
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
      console.error('Gemini API Error:', errorMsg);
      
      if (errorMsg.includes('API_KEY') || errorMsg.includes('api_key') || errorMsg.toLowerCase().includes('authentication')) {
        throw new Error('System Error: Invalid configuration. Please check the API key.');
      }
      
      // Handle quota/rate limit errors
      if (errorMsg.includes('429') || errorMsg.toLowerCase().includes('quota') || errorMsg.toLowerCase().includes('rate limit')) {
        throw new Error('API quota exceeded. The free tier has limited requests. Please wait a moment and try again, or check your API plan at https://ai.google.dev/pricing');
      }
      
      throw new Error(`The AI agent is currently unavailable: ${errorMsg}. Please try again in a moment.`);
    }
  }
}

