'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
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
  messages: Message[];
  lastMessageAt: string;
}

export default function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const prevMsgCountRef = useRef(0);

  // Initialize/Fetch conversation when opened
  useEffect(() => {
    if (!isOpen) return;

    let interval: NodeJS.Timeout;

    const fetchChat = async () => {
      try {
        if (!conversation) setLoading(true);
        const data = await apiFetch('/api/chat', { cache: 'no-store' }) as any;
        if (data.conversations && data.conversations.length > 0) {
          const activeConv = data.conversations[0];
          setConversation(activeConv);
          
          // Fetch messages for this conversation
          const msgData = await apiFetch(`/api/chat/${activeConv._id}`) as any;
          setMessages(msgData.conversation?.messages || []);
        }
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchChat();
    interval = setInterval(fetchChat, 3000);

    return () => clearInterval(interval);
  }, [isOpen, conversation?._id]);

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
      if (!conversation) {
        const data = await apiFetch('/api/chat', {
          method: 'POST',
          body: JSON.stringify({ message: messageText })
        }) as any;
        setConversation(data.conversation);
        setMessages(data.conversation.messages);
        prevMsgCountRef.current = 0;
      } else {
        const data = await apiFetch(`/api/chat/${conversation._id}`, {
          method: 'POST',
          body: JSON.stringify({ message: messageText })
        }) as any;
        setMessages(data.conversation.messages);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl border border-surface-muted w-80 sm:w-96 mb-4 flex flex-col h-[28rem] overflow-hidden transform transition-all">
          {/* Header */}
          <div className="bg-brand-500 p-4 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold leading-tight">Chat dengan Admin</h3>
                <p className="text-[10px] text-white/80">Kami siap membantu Anda</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Area */}
          <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto bg-surface-50 flex flex-col gap-3 scroll-smooth">
            {loading ? (
              <div className="m-auto text-sm text-surface-sub">Memuat obrolan...</div>
            ) : messages.length === 0 ? (
              <div className="m-auto text-center">
                <MessageSquare className="w-8 h-8 text-surface-muted mx-auto mb-2" />
                <p className="text-sm text-surface-sub">Halo! Ada yang bisa kami bantu terkait produk kami?</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div 
                  key={msg._id || i} 
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                    msg.senderRole === 'user' 
                      ? 'bg-brand-500 text-white self-end rounded-br-sm' 
                      : 'bg-white text-surface-ink border border-surface-muted self-start rounded-bl-sm'
                  }`}
                >
                  <p>{msg.message}</p>
                  <span className={`text-[10px] mt-1 block text-right ${msg.senderRole === 'user' ? 'text-brand-100' : 'text-surface-sub'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-surface-muted flex gap-2 shrink-0">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Tulis pesan..."
              className="flex-1 bg-surface border border-surface-muted rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
            <button 
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-brand-500 text-white p-2.5 rounded-xl disabled:opacity-50 hover:bg-brand-600 transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-brand-500 text-white rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 hover:bg-brand-600 transition-all flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-brand-100 group"
          aria-label="Buka Chat"
        >
          <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="absolute -top-2 -right-2 bg-red-500 w-3.5 h-3.5 rounded-full border-2 border-white animate-pulse"></span>
        </button>
      )}
    </div>
  );
}
