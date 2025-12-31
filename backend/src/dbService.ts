import db from './database';
import { Conversation, Message, ConversationModel, MessageModel } from './types';

export class DatabaseService {
  getConversations(): Conversation[] {
    const stmt = db.prepare(`
      SELECT * FROM conversations 
      ORDER BY created_at DESC
    `);
    
    const rows = stmt.all() as ConversationModel[];
    
    return rows.map(conv => ({
      id: conv.id,
      title: conv.title,
      createdAt: conv.created_at,
      lastMessage: conv.last_message || ''
    }));
  }

  getMessagesBySession(sessionId: string,limit?: number): Message[] {
    let query = `
      SELECT * FROM messages 
      WHERE conversation_id = ? 
      ORDER BY timestamp ASC
    `
    if (limit && limit > 0) {
      query += ` LIMIT ?`;
    }
    const stmt = db.prepare(query);
   
    const rows = limit
    ? (stmt.all(sessionId, limit) as MessageModel[])
    : (stmt.all(sessionId) as MessageModel[]);
    
    return rows.map(msg => ({
      id: msg.id,
      conversationId: msg.conversation_id,
      sender: msg.sender,
      text: msg.text,
      timestamp: msg.timestamp
    }));
  }

  saveMessage(message: Message): void {
    const transaction = db.transaction(() => {
      // Check if message already exists
      const existing = db.prepare('SELECT id FROM messages WHERE id = ?').get(message.id) as { id: string } | undefined;
      
      if (existing) {
        // Update existing message
        db.prepare(`
          UPDATE messages 
          SET text = ?, timestamp = ? 
          WHERE id = ?
        `).run(message.text, message.timestamp, message.id);
      } else {
        // Insert new message
        db.prepare(`
          INSERT INTO messages (id, conversation_id, sender, text, timestamp)
          VALUES (?, ?, ?, ?, ?)
        `).run(
          message.id,
          message.conversationId,
          message.sender,
          message.text,
          message.timestamp
        );
      }

      // Update conversation's last message
      db.prepare(`
        UPDATE conversations 
        SET last_message = ? 
        WHERE id = ?
      `).run(message.text, message.conversationId);
    });

    transaction();
  }

  createConversation(id: string, title: string): Conversation {
    // Check if conversation already exists
    const existing = db.prepare('SELECT * FROM conversations WHERE id = ?').get(id) as ConversationModel | undefined;
    
    if (existing) {
      return {
        id: existing.id,
        title: existing.title,
        createdAt: existing.created_at,
        lastMessage: existing.last_message || ''
      };
    }

    const createdAt = Date.now();
    
    db.prepare(`
      INSERT INTO conversations (id, title, created_at, last_message)
      VALUES (?, ?, ?, ?)
    `).run(id, title, createdAt, '');

    return {
      id,
      title,
      createdAt,
      lastMessage: ''
    };
  }

  deleteConversation(id: string): void {
    const transaction = db.transaction(() => {
      // Delete all messages first (CASCADE should handle this, but being explicit)
      db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(id);
      
      // Delete conversation
      db.prepare('DELETE FROM conversations WHERE id = ?').run(id);
    });

    transaction();
  }
}

