import Database from 'better-sqlite3';
import path from 'path';
import { ConversationModel, MessageModel } from './types';

const DB_PATH = path.join(__dirname, '..', 'lumina_support.db');

// Initialize database connection
export const db = new Database(DB_PATH);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database tables
export function initDb(): void {
  // Create conversations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      last_message TEXT
    )
  `);

  // Create messages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender TEXT NOT NULL,
      text TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);
  `);
}

// Close database connection (useful for graceful shutdown)
export function closeDb(): void {
  db.close();
}

