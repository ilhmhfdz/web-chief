'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { apiFetch } from '@/lib/utils/apiFetch';

interface Message {
  _id: string;
  senderRole: 'user' | 'admin';
  message: string;
  createdAt: string;
}

interface Conversation {
  _id: string;
  subject: string;
  orderId?: string;
  messages: Message[];
  lastMessageAt: string;
}

export default function UserChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const prevMsgCountRef = useRef(0);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const data = await apiFetch('/api/chat', { cache: 'no-store' }) as any;
      setConversations(data.conversations || []);
      if (data.conversations?.length > 0 && !activeConvId) {
        setActiveConvId(data.conversations[0]._id);
      }
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
        const data = await apiFetch(`/api/chat/${activeConvId}`, { cache: 'no-store' }) as any;
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
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      if (!activeConvId) {
        const data = await apiFetch('/api/chat', {
          method: 'POST',
          body: JSON.stringify({ message: messageText })
        }) as any;
        setConversations([data.conversation, ...conversations]);
        setActiveConvId(data.conversation._id);
        prevMsgCountRef.current = 0; // reset scroll counter for new chat
        setMessages(data.conversation.messages);
      } else {
        const data = await apiFetch(`/api/chat/${activeConvId}`, {
          method: 'POST',
          body: JSON.stringify({ message: messageText })
        }) as any;
        setMessages(data.conversation.messages);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartNew = () => {
    setActiveConvId(null);
    setMessages([]);
    prevMsgCountRef.current = 0;
  };

  if (loading) {
    return <div className="p-8 text-center text-surface-sub">Memuat chat...</div>;
  }

  return (
    <div className="flex h-full flex-col md:flex-row border-t-0 bg-white rounded-b-xl min-h-[500px]">
      {/* Sidebar */}
      <div className="w-full md:w-1/3 border-r border-surface-muted flex flex-col max-h-[500px]">
        <div className="p-4 border-b border-surface-muted flex justify-between items-center bg-surface">
          <h3 className="font-semibold text-brand-900">Percakapan</h3>
          <button 
            onClick={handleStartNew}
            className="text-xs bg-brand-500 text-white px-3 py-1.5 rounded hover:bg-brand-600 transition"
          >
            + Baru
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-surface-sub text-sm">
              Belum ada percakapan.
            </div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv._id}
                onClick={() => setActiveConvId(conv._id)}
                className={`w-full text-left p-4 border-b border-surface-muted hover:bg-brand-50 transition-colors ${
                  activeConvId === conv._id ? 'bg-brand-50 border-l-4 border-l-brand-500' : 'border-l-4 border-l-transparent'
                }`}
              >
                <p className="font-semibold text-sm text-brand-900 truncate">{conv.subject}</p>
                <p className="text-xs text-surface-sub mt-1 truncate">
                  {conv.messages[conv.messages.length - 1]?.message || 'No messages'}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col max-h-[500px] bg-[#fafaf9]">
        <div className="p-4 border-b border-surface-muted bg-white flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-brand-500" />
          <h3 className="font-semibold text-brand-900">
            {activeConvId ? 'Chat dengan Admin' : 'Pesan Baru'}
          </h3>
        </div>
        
        <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 scroll-smooth">
          {!activeConvId && messages.length === 0 && (
            <div className="m-auto text-center text-surface-sub text-sm">
              Kirim pesan untuk memulai percakapan baru.
            </div>
          )}
          {messages.map((msg, i) => (
            <div 
              key={msg._id || i} 
              className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${
                msg.senderRole === 'user' 
                  ? 'bg-brand-500 text-white self-end rounded-br-none' 
                  : 'bg-white text-surface-ink border border-surface-muted self-start rounded-bl-none shadow-sm'
              }`}
            >
              <p>{msg.message}</p>
              <span className={`text-[10px] mt-1 block ${msg.senderRole === 'user' ? 'text-brand-100' : 'text-surface-sub'}`}>
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-surface-muted flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Tulis pesan..."
            className="flex-1 bg-surface border border-surface-muted rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brand-500"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-brand-500 text-white p-2.5 rounded-lg disabled:opacity-50 hover:bg-brand-600 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
