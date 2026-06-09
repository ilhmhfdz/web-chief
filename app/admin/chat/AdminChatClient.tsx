'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Search, Bot } from 'lucide-react';
import { apiFetch } from '@/lib/utils/apiFetch';

interface Message {
  _id: string;
  senderRole: 'user' | 'admin' | 'ai';
  message: string;
  createdAt: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
}

interface Conversation {
  _id: string;
  subject: string;
  orderId?: string;
  userId: User;
  messages: Message[];
  handledBy?: 'ai' | 'human';
  lastMessageAt: string;
}

export default function AdminChatClient() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const prevMsgCountRef = useRef(0);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const data = await apiFetch('/api/chat') as any;
      setConversations(data.conversations || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeConvId) return;

    const fetchMessages = async () => {
      try {
        const data = await apiFetch(`/api/chat/${activeConvId}`) as any;
        setMessages(data.conversation?.messages || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [activeConvId]);

  useEffect(() => {
    if (messages.length > prevMsgCountRef.current || prevMsgCountRef.current === 0) {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }
    prevMsgCountRef.current = messages.length;
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConvId) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      const data = await apiFetch(`/api/chat/${activeConvId}`, {
        method: 'POST',
        body: JSON.stringify({ message: messageText })
      }) as any;
      setMessages(data.conversation.messages);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredConversations = conversations.filter(conv => 
    conv.userId?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeConv = conversations.find(c => c._id === activeConvId);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-xl border border-surface-muted shadow-sm overflow-hidden">
      <div className="flex h-full flex-col md:flex-row">
        
        {/* Sidebar */}
        <div className="w-full md:w-80 border-r border-surface-muted flex flex-col bg-surface">
          <div className="p-4 border-b border-surface-muted">
            <h2 className="font-bold text-lg text-brand-900 mb-4">Pesan Pelanggan</h2>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-sub" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari pelanggan..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-surface-muted rounded-lg focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-surface-sub">Memuat...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-sm text-surface-sub">Tidak ada percakapan.</div>
            ) : (
              filteredConversations.map(conv => (
                <button
                  key={conv._id}
                  onClick={() => {
                    setActiveConvId(conv._id);
                    prevMsgCountRef.current = 0;
                  }}
                  className={`w-full text-left p-4 border-b border-surface-muted hover:bg-brand-50 transition-colors ${
                    activeConvId === conv._id ? 'bg-brand-50 border-l-4 border-l-brand-500' : 'border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-semibold text-sm text-brand-900 truncate pr-2">
                      {conv.userId?.name || 'User'}
                    </p>
                    <span className="text-[10px] text-surface-sub whitespace-nowrap">
                      {new Date(conv.lastMessageAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-brand-600 truncate font-medium mb-1 flex items-center gap-2">
                    {conv.subject}
                    {conv.handledBy === 'ai' && (
                      <span className="bg-brand-100 text-brand-700 text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Bot className="w-3 h-3" /> AI
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-surface-sub truncate">
                    {conv.messages[conv.messages.length - 1]?.message || 'No messages'}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-[#fafaf9]">
          {activeConvId && activeConv ? (
            <>
              <div className="p-4 border-b border-surface-muted bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold">
                    {activeConv.userId?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-900 leading-none mb-1">{activeConv.userId?.name}</h3>
                    <p className="text-xs text-surface-sub">{activeConv.subject}</p>
                  </div>
                </div>
                {activeConv.handledBy === 'ai' && (
                  <button
                    onClick={async () => {
                      try {
                        await apiFetch(`/api/chat/${activeConvId}`, {
                          method: 'PATCH',
                          body: JSON.stringify({ handledBy: 'human' })
                        });
                        setConversations(conversations.map(c => c._id === activeConvId ? { ...c, handledBy: 'human' } : c));
                      } catch (err) { console.error(err); }
                    }}
                    className="text-xs bg-brand-100 text-brand-700 hover:bg-brand-200 px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    Ambil Alih (Take Over)
                  </button>
                )}
              </div>
              
              <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 scroll-smooth">
                {messages.map((msg, i) => (
                  <div 
                    key={msg._id || i} 
                    className={`max-w-[80%] rounded-xl px-4 py-2 text-sm shadow-sm flex flex-col ${
                      msg.senderRole === 'admin' 
                        ? 'bg-brand-500 text-white self-end rounded-br-none' 
                        : msg.senderRole === 'ai'
                        ? 'bg-brand-100 border border-brand-200 text-brand-900 self-end rounded-br-none'
                        : 'bg-white text-surface-ink border border-surface-muted self-start rounded-bl-none'
                    }`}
                  >
                    {msg.senderRole === 'ai' && (
                      <div className="flex items-center gap-1.5 mb-1 text-brand-600">
                        <Bot className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold">AI Assistant</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                    <span className={`text-[10px] mt-1 block ${msg.senderRole === 'admin' ? 'text-brand-100' : 'text-surface-sub'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-surface-muted flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Ketik balasan untuk pelanggan..."
                  className="flex-1 bg-surface border border-surface-muted rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brand-500"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-brand-500 text-white px-6 py-2 rounded-lg disabled:opacity-50 hover:bg-brand-600 transition-colors font-medium flex items-center gap-2"
                >
                  <span>Kirim</span>
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-surface-sub flex-col gap-3">
              <MessageSquare className="w-12 h-12 text-surface-muted" />
              <p>Pilih percakapan dari panel di sebelah kiri</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
