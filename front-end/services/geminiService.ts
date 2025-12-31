
import { ChatResponse, ChatRequest } from "../types";
import { API_BASE_URL } from "../constants";

export const chatService = {
  sendMessage: async (text: string, sessionId?: string): Promise<ChatResponse> => {
    const trimmedMessage = text.trim();
    if (!trimmedMessage) {
      throw new Error("Message cannot be empty.");
    }
    if (trimmedMessage.length > 2000) {
      throw new Error("Message is too long. Please limit to 2000 characters.");
    }

    try {
      const requestBody: ChatRequest = {
        message: trimmedMessage,
        sessionId: sessionId
      };

      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data: ChatResponse = await response.json();
      return data;
    } catch (error: any) {
      console.error("Chat API Error:", error);
      let errorMsg = "The AI agent is currently unavailable. Please try again in a moment.";
      if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')) {
        errorMsg = "Unable to connect to the server. Please make sure the backend is running.";
      } else if (error?.message) {
        errorMsg = error.message;
      }
      throw new Error(errorMsg);
    }
  }
};
