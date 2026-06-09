'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User as UserIcon, Loader2, HeadphonesIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/utils/apiFetch';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatWidget() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [handledBy, setHandledBy] = useState<'ai' | 'human'>('ai');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleOpen = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (isOpen && user) {
      fetchConversations();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (activeConvId) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setLoadingInitial(true);
      const data = await apiFetch('/api/chat', { cache: 'no-store' }) as any;
      if (data.conversations && data.conversations.length > 0) {
        setConversations(data.conversations);
        setActiveConvId(data.conversations[0]._id);
        setHandledBy(data.conversations[0].handledBy || 'ai');
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoadingInitial(false);
    }
  };

  const fetchMessages = async () => {
    if (!activeConvId) return;
    try {
      const data = await apiFetch(`/api/chat/${activeConvId}`, { cache: 'no-store' }) as any;
      if (data.conversation) {
        setMessages(data.conversation.messages || []);
        setHandledBy(data.conversation.handledBy || 'ai');
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      let currentConvId = activeConvId;
      
      // If no conversation exists, create one first
      if (!currentConvId) {
        const createData = await apiFetch('/api/chat', {
          method: 'POST',
          body: JSON.stringify({ subject: 'Layanan Pelanggan', message: messageText })
        }) as any;
        currentConvId = createData.conversation._id;
        setActiveConvId(currentConvId);
        setHandledBy(createData.conversation.handledBy || 'ai');
        setMessages(createData.conversation.messages);
      } else {
        // Send message to existing conversation
        const sendData = await apiFetch(`/api/chat/${currentConvId}`, {
          method: 'POST',
          body: JSON.stringify({ message: messageText })
        }) as any;
        setMessages(sendData.conversation.messages);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const requestHumanSupport = async () => {
    if (!activeConvId) return;
    try {
      await apiFetch(`/api/chat/${activeConvId}`, {
        method: 'PATCH',
        body: JSON.stringify({ handledBy: 'human' })
      });
      setHandledBy('human');
    } catch (err) {
      console.error('Error requesting human support:', err);
    }
  };

  return (
    <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-[60] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4 w-[350px] sm:w-[400px] h-[500px] bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl rounded-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-brand-600/90 backdrop-blur-md p-4 flex items-center justify-between shadow-sm relative z-10">
              <div className="flex items-center gap-3 text-white">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border border-white/30 shadow-inner">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Chief Assistant</h3>
                  <p className="text-xs text-white/80">Selalu siap membantu Anda</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white/40 to-white/10 relative">
              {loadingInitial ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-surface-sub space-y-3 opacity-70">
                  <Bot className="w-12 h-12 text-brand-300" />
                  <p className="text-sm">Halo! Ada yang bisa kami bantu hari ini?</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isUser = msg.senderRole === 'user';
                  const isAi = msg.senderRole === 'ai';
                  
                  return (
                    <motion.div 
                      key={msg._id || idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2`}
                    >
                      {!isUser && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center flex-shrink-0 shadow-sm mt-auto">
                          {isAi ? <Bot className="w-4 h-4 text-white" /> : <HeadphonesIcon className="w-4 h-4 text-white" />}
                        </div>
                      )}
                      
                      <div className={`max-w-[75%] p-3 text-sm shadow-sm ${
                        isUser 
                          ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-2xl rounded-tr-sm' 
                          : 'bg-white/80 backdrop-blur-md border border-white/50 text-surface-ink rounded-2xl rounded-tl-sm'
                      }`}>
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                        <span className={`text-[10px] mt-1.5 block opacity-70 ${isUser ? 'text-right' : 'text-left'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {isUser && (
                        <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center flex-shrink-0 shadow-sm mt-auto">
                          <UserIcon className="w-4 h-4 text-surface-sub" />
                        </div>
                      )}
                    </motion.div>
                  )
                })
              )}
              {isSending && (
                <div className="flex justify-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white/80 backdrop-blur-md border border-white/50 rounded-2xl rounded-tl-sm p-3">
                    <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Handover indicator */}
            {activeConvId && handledBy === 'ai' && (
              <div className="bg-surface-raised border-t border-white/40 p-2 text-center text-xs">
                <p className="text-surface-sub">Tidak menemukan jawaban? <button onClick={requestHumanSupport} className="text-brand-600 hover:text-brand-700 font-medium underline transition-colors">Bicara dengan Admin</button></p>
              </div>
            )}
            {handledBy === 'human' && (
              <div className="bg-brand-50 border-t border-brand-100 p-2 text-center text-xs flex items-center justify-center gap-1.5 text-brand-700">
                <HeadphonesIcon className="w-3.5 h-3.5" />
                <span>Admin telah bergabung di obrolan ini.</span>
              </div>
            )}

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white/60 backdrop-blur-xl border-t border-white/40 flex gap-2 relative z-10">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Ketik pesan..."
                className="flex-1 bg-white/80 border border-surface-muted rounded-full px-4 py-2 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 transition-all shadow-sm"
                disabled={isSending}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || isSending}
                className="bg-brand-600 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-brand-700 disabled:opacity-50 disabled:hover:bg-brand-600 transition-all shadow-md transform hover:scale-105 active:scale-95"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={toggleOpen}
        className="w-14 h-14 bg-brand-600 text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-brand-700 transition-all transform hover:scale-105 active:scale-95 relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300"></div>
        {isOpen ? (
          <X className="w-6 h-6 relative z-10" />
        ) : (
          <MessageSquare className="w-6 h-6 relative z-10" />
        )}
      </button>
    </div>
  );
}
