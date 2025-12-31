
import { Message, Conversation } from '../types';
import { API_BASE_URL } from '../constants';

export const dbService = {
  getConversations: async (): Promise<Conversation[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/conversations`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to fetch conversations');
      }
      return await response.json();
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      // Return empty array on error to prevent UI breaking
      return [];
    }
  },

  getMessagesBySession: async (sessionId: string): Promise<Message[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/conversations/${sessionId}/messages`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to fetch messages');
      }
      return await response.json();
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      // Return empty array on error to prevent UI breaking
      return [];
    }
  },

  saveMessage: async (message: Message): Promise<void> => {
    // Messages are saved automatically by the backend when sending chat messages
    // This method is kept for compatibility but doesn't need to do anything
    // as the backend handles message persistence
  },

  createConversation: async (id: string, title: string): Promise<Conversation> => {
    // Conversations are created automatically by the backend when sending the first message
    // This method is kept for compatibility but doesn't need to do anything
    return {
      id,
      title,
      createdAt: Date.now(),
      lastMessage: ''
    };
  },

  deleteConversation: async (id: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/conversations/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to delete conversation');
      }
    } catch (error: any) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }
};
