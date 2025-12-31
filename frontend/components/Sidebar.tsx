
import React from 'react';
import { Conversation } from '../types.ts';
import { MessageSquare, Plus, Trash2, Clock } from 'lucide-react';

interface SidebarProps {
  conversations: Conversation[];
  activeId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export default function Sidebar({ conversations, activeId, onSelect, onNew, onDelete }: SidebarProps) {
  return (
    <div className="h-full flex flex-col bg-slate-900 text-slate-300 w-full">
      <div className="p-4 border-b border-slate-800">
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors text-sm font-semibold shadow-lg shadow-indigo-900/20"
        >
          <Plus size={18} />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Recent Conversations
        </div>
        
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm italic">
            No history yet
          </div>
        ) : (
          [...conversations].sort((a,b) => b.createdAt - a.createdAt).map((conv) => (
            <div
              key={conv.id}
              className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                activeId === conv.id 
                  ? 'bg-slate-800 text-white' 
                  : 'hover:bg-slate-800/50'
              }`}
              onClick={() => onSelect(conv.id)}
            >
              <MessageSquare size={16} className={activeId === conv.id ? 'text-indigo-400' : 'text-slate-500'} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{conv.title || 'Untitled Chat'}</div>
                <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <Clock size={10} />
                  {new Date(conv.createdAt).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(conv.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500">
        &copy; 2024 Lumina Gear Inc.
      </div>
    </div>
  );
}
