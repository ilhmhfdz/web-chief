'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Headphones } from 'lucide-react';
import { apiFetch } from '@/lib/utils/apiFetch';

interface Message {
  _id: string;
  senderRole: 'user' | 'admin';
  message: string;
  createdAt: string;
}

interface Conversation {
  _id: string;
  messages: Message[];
}

interface ProductChatButtonProps {
  productName: string;
}

export default function ProductChatButton({ productName }: ProductChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevCountRef = useRef(0);

  // Load / poll conversation
  useEffect(() => {
    if (!isOpen) return;
    let interval: NodeJS.Timeout;

    const fetchMessages = async () => {
      try {
        const data = await apiFetch('/api/chat') as any;
        if (data.conversations?.length > 0) {
          const conv = data.conversations[0];
          if (conv._id !== conversation?._id) setConversation(conv);
          const detail = await apiFetch(`/api/chat/${conv._id}`) as any;
          setMessages(detail.conversation?.messages || []);
        }
      } catch { /* silent */ }
    };

    fetchMessages();
    interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Auto-scroll only on new messages
  useEffect(() => {
    if (messages.length > prevCountRef.current) {
      chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
    }
    prevCountRef.current = messages.length;
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 150);
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    // Pre-fill with product context
    setNewMessage(`Halo, saya ingin bertanya tentang produk "${productName}". `);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || sending) return;
    setSending(true);
    setNewMessage('');

    try {
      if (!conversation) {
        const data = await apiFetch('/api/chat', {
          method: 'POST',
          body: JSON.stringify({ message: text, subject: `Tanya produk: ${productName}` })
        }) as any;
        setConversation(data.conversation);
        setMessages(data.conversation.messages);
        prevCountRef.current = 0;
      } else {
        const data = await apiFetch(`/api/chat/${conversation._id}`, {
          method: 'POST',
          body: JSON.stringify({ message: text })
        }) as any;
        setMessages(data.conversation.messages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* ── Trigger button — fixed row di bawah CTA utama ── */}
      <button
        onClick={handleOpen}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border-2 border-brand-500 text-brand-600 bg-brand-50 hover:bg-brand-500 hover:text-white font-semibold text-sm transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-brand-300"
      >
        <MessageSquare className="w-4 h-4" />
        Chat Sekarang
      </button>

      {/* ── Popup ── */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel — mobile: sits above bottom nav; desktop: bottom-left corner */}
          <div
            className="fixed z-50 bottom-[68px] left-3 right-3 sm:bottom-6 sm:left-4 sm:right-auto sm:w-[23rem] flex flex-col bg-white rounded-2xl shadow-2xl border border-surface-muted overflow-hidden"
            style={{ maxHeight: 'min(34rem, calc(100dvh - 80px))' }}
          >
            {/* Header */}
            <div className="bg-brand-500 px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <Headphones className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm leading-none">Chief Support</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse inline-block" />
                    <p className="text-white/75 text-[10px]">Tanya seputar produk ini</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Product context chip */}
            <div className="px-4 py-2 bg-brand-50 border-b border-brand-100 flex items-center gap-2 shrink-0">
              <span className="text-[10px] text-brand-600 font-semibold uppercase tracking-wider">Produk:</span>
              <span className="text-xs text-brand-800 font-medium truncate">{productName}</span>
            </div>

            {/* Messages */}
            <div
              ref={chatRef}
              className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-[#f7f6f4]"
              style={{ minHeight: 0 }}
            >
              {messages.length === 0 ? (
                <div className="m-auto text-center px-4 py-4">
                  <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="w-5 h-5 text-brand-500" />
                  </div>
                  <p className="text-sm font-semibold text-surface-ink mb-1">Ada yang ingin ditanyakan?</p>
                  <p className="text-xs text-surface-sub">Kirim pesan dan admin kami akan segera membalas.</p>
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
                    <p className="leading-relaxed">{msg.message}</p>
                    <time className={`text-[10px] mt-1 block text-right ${msg.senderRole === 'user' ? 'text-brand-200' : 'text-surface-sub'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </time>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={handleSend}
              className="flex gap-2 p-3 bg-white border-t border-surface-muted shrink-0"
            >
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Tulis pertanyaan Anda…"
                className="flex-1 bg-surface border border-surface-muted rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-300 transition"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="w-10 h-10 flex items-center justify-center bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white rounded-xl transition-colors shrink-0"
                aria-label="Kirim"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
}
