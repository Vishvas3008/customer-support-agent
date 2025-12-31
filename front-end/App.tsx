
import React, { useState, useEffect, useRef } from 'react';
import { dbService } from './services/dbService.ts';
import { chatService } from './services/geminiService.ts';
import { Message, Conversation } from './types.ts';
import Sidebar from './components/Sidebar.tsx';
import ChatMessage from './components/ChatMessage.tsx';
import ChatInput from './components/ChatInput.tsx';
import { Menu, X, Info, HelpCircle } from 'lucide-react';
import { STORE_KNOWLEDGE } from './constants.ts';

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Load initial data
  useEffect(() => {
    const loadConversations = async () => {
      const history = await dbService.getConversations();
      setConversations(history);
      if (history.length > 0) {
        setActiveId(history[0].id);
      }
    };
    loadConversations();
  }, []);

  // Sync messages when active conversation changes
  useEffect(() => {
    const loadMessages = async () => {
      if (activeId) {
        const msgs = await dbService.getMessagesBySession(activeId);
        setMessages(msgs);
      } else {
        setMessages([]);
      }
    };
    loadMessages();
  }, [activeId]);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleNewChat = () => {
    setActiveId(undefined);
    setMessages([]);
    setError(null);
    setIsSidebarOpen(false);
  };

  const handleSelectChat = (id: string) => {
    setActiveId(id);
    setError(null);
    setIsSidebarOpen(false);
  };

  const handleDeleteChat = async (id: string) => {
    try {
      await dbService.deleteConversation(id);
      const updated = await dbService.getConversations();
      setConversations(updated);
      if (activeId === id) {
        if (updated.length > 0) {
          setActiveId(updated[0].id);
        } else {
          handleNewChat();
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      setError('Failed to delete conversation. Please try again.');
    }
  };

  const handleSendMessage = async (text: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await chatService.sendMessage(text, activeId);
      
      if (!activeId) {
        setActiveId(response.sessionId);
        const updatedConvs = await dbService.getConversations();
        setConversations(updatedConvs);
      }
      
      const updatedMessages = await dbService.getMessagesBySession(response.sessionId);
      setMessages(updatedMessages);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      if (activeId) {
        const msgs = await dbService.getMessagesBySession(activeId);
        setMessages(msgs);
      } else {
        const currentConvs = await dbService.getConversations();
        if (currentConvs.length > conversations.length) {
          const latest = [...currentConvs].sort((a,b) => b.createdAt - a.createdAt)[0];
          setActiveId(latest.id);
          setConversations(currentConvs);
          const msgs = await dbService.getMessagesBySession(latest.id);
          setMessages(msgs);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden relative">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 lg:static lg:block transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <Sidebar 
          conversations={conversations}
          activeId={activeId}
          onSelect={handleSelectChat}
          onNew={handleNewChat}
          onDelete={handleDeleteChat}
        />
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-white shadow-2xl relative z-10">
        <header className="h-16 flex items-center justify-between px-4 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-none mb-1">
                {STORE_KNOWLEDGE.name} Support
              </h1>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">AI Agent Active</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-full border border-slate-200 transition-colors">
              <Info size={14} />
              Policies
            </button>
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
              <HelpCircle size={18} />
            </button>
          </div>
        </header>

        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 bg-slate-50/50"
        >
          <div className="max-w-4xl mx-auto py-8">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center mt-12 px-4 animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-200/50">
                  <HelpCircle size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">How can we help you today?</h2>
                <p className="text-slate-500 max-w-sm mb-8">
                  Ask me about shipping rates, our 30-day return policy, or international availability.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
                  {[
                    "What's your return policy?",
                    "Do you ship to Germany?",
                    "Where are you located?",
                    "What are your support hours?"
                  ].map((query) => (
                    <button
                      key={query}
                      onClick={() => handleSendMessage(query)}
                      className="text-left p-3 text-sm bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/30 transition-all shadow-sm"
                    >
                      {query}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((m) => (
                  <ChatMessage key={m.id} message={m} />
                ))}
                
                {isLoading && (
                  <div className="flex justify-start items-start gap-3 animate-pulse mb-6">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                      <HelpCircle size={16} className="text-slate-400" />
                    </div>
                    <div className="bg-slate-200 h-10 w-24 rounded-2xl rounded-tl-none" />
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm flex flex-col gap-2 mt-4 max-w-md mx-auto">
                    <div className="font-bold flex items-center gap-2">
                      <X size={14} /> Message Failed
                    </div>
                    {error}
                    <button 
                      onClick={() => setError(null)}
                      className="text-[10px] uppercase font-bold text-red-400 hover:text-red-600 self-end"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </main>
    </div>
  );
}
