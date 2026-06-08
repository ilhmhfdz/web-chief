'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  iconOnly?: boolean;
}

export default function ProductChatButton({ productName, iconOnly = false }: ProductChatButtonProps) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevCountRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      {/* ── Trigger button ── */}
      {iconOnly ? (
        <button
          onClick={handleOpen}
          className="w-11 h-11 flex items-center justify-center rounded-xl bg-surface-raised border border-surface-muted/60 text-surface-sub hover:text-surface-ink hover:bg-white hover:border-surface-border hover:shadow-sm transition-all duration-300 active:scale-95 shrink-0"
          aria-label="Chat Sekarang"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      ) : (
        <button
          onClick={handleOpen}
          className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-surface-raised border border-surface-muted/60 text-surface-ink hover:bg-white hover:border-surface-border hover:shadow-sm font-bold text-sm transition-all duration-300 active:scale-95 focus:outline-none focus:ring-2 focus:ring-surface-ink/20 whitespace-nowrap group"
        >
          <MessageSquare className="w-4.5 h-4.5 text-surface-sub group-hover:text-surface-ink transition-colors" />
          Chat Sekarang
        </button>
      )}

      {/* ── Popup ── */}
      {isOpen && mounted && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-[2px] transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel — positioned at bottom right to be closer to the button */}
          <div
            className="fixed z-[101] bottom-0 left-0 right-0 sm:bottom-6 sm:right-6 sm:left-auto sm:w-[24rem] flex flex-col bg-white sm:rounded-2xl shadow-2xl border border-surface-muted overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300"
            style={{ height: 'min(36rem, 100dvh)' }}
          >
            {/* Header */}
            <div className="bg-surface-ink px-4 py-3.5 flex items-center justify-between shrink-0 shadow-sm relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                  <Headphones className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-tight">Chief Support</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse border border-green-200/30" />
                    <p className="text-white/80 text-[11px] font-medium">Tanya seputar produk ini</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product context chip */}
            <div className="px-4 py-2.5 bg-surface-raised border-b border-surface-muted flex items-center gap-2 shrink-0 shadow-sm z-0">
              <span className="text-[10px] text-surface-sub font-bold uppercase tracking-wider bg-white px-2 py-0.5 rounded shadow-sm border border-surface-muted/50">Produk</span>
              <span className="text-xs text-surface-ink font-semibold truncate flex-1">{productName}</span>
            </div>

            {/* Messages */}
            <div
              ref={chatRef}
              className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 bg-[#f7f6f4]"
              style={{ minHeight: 0 }}
            >
              {messages.length === 0 ? (
                <div className="m-auto text-center px-4 py-6 bg-white rounded-2xl shadow-sm border border-surface-muted/50 max-w-[90%]">
                  <div className="w-12 h-12 bg-surface-raised rounded-full flex items-center justify-center mx-auto mb-3 border border-surface-muted">
                    <MessageSquare className="w-5 h-5 text-surface-ink" />
                  </div>
                  <p className="text-sm font-bold text-surface-ink mb-1.5">Ada pertanyaan?</p>
                  <p className="text-[12px] text-surface-sub leading-relaxed">Kirim pesan di bawah dan admin kami akan segera merespon pertanyaan Anda mengenai produk ini.</p>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div
                    key={msg._id || i}
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-[13px] shadow-sm ${msg.senderRole === 'user'
                        ? 'bg-surface-ink text-white self-end rounded-br-sm'
                        : 'bg-white text-surface-ink border border-surface-muted self-start rounded-bl-sm'
                      }`}
                  >
                    <p className="leading-relaxed">{msg.message}</p>
                    <time className={`text-[10px] mt-1.5 block text-right font-medium ${msg.senderRole === 'user' ? 'text-white/70' : 'text-surface-sub/80'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </time>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={handleSend}
              className="flex gap-2.5 p-3.5 bg-white border-t border-surface-muted shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]"
            >
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Ketik pesan Anda di sini..."
                className="flex-1 bg-surface-raised border border-surface-muted hover:border-surface-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-surface-ink focus:ring-1 focus:ring-surface-ink focus:bg-white transition-all shadow-inner"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="w-11 h-11 flex items-center justify-center bg-surface-ink hover:bg-black disabled:opacity-40 text-white rounded-xl transition-all shadow-md hover:shadow-lg shrink-0 active:scale-95"
                aria-label="Kirim"
              >
                <Send className="w-4.5 h-4.5 ml-0.5" />
              </button>
            </form>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
