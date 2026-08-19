'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MessageCircle, X, Send, Loader2, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn, formatRelativeTime, initials } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import {
  useChatMessages,
  useSendChatMessage,
  useMarkChatRead,
  useChatRealtime,
} from '@/hooks/use-chat';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { ChatMessage } from '@/types/database';

export function ChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('chat') === 'open') {
      setOpen(true);
    }
  }, [searchParams]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: msgData, isLoading } = useChatMessages();
  const messages: ChatMessage[] = msgData ?? [];
  const sendMutation = useSendChatMessage();
  const markRead = useMarkChatRead();
  useChatRealtime(user?.id);

  const chatMessages: ChatMessage[] = messages;
  const unreadAdminMessages = chatMessages.filter((m) => m.sender === 'admin' && !m.read);
  const unreadCount = unreadAdminMessages.length;

  useEffect(() => {
    if (open && unreadAdminMessages.length > 0) {
      markRead.mutate(unreadAdminMessages.map((m) => m.id));
    }
  }, [open, unreadAdminMessages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length, open]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sendMutation.isPending) return;
    sendMutation.mutate(input.trim(), {
      onSuccess: () => setInput(''),
      onError: (err) => {
        import('sonner').then(({ toast }) =>
          toast.error(err instanceof Error ? err.message : 'Failed to send message')
        );
      },
    });
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow transition-transform hover:scale-105"
        aria-label="Open chat"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[min(520px,calc(100vh-120px))] w-[min(380px,calc(100vw-3rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card animate-scale-in">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-border bg-secondary p-4 text-secondary-foreground">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
              <Bot className="h-5 w-5 text-primary" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold">PesaCred Support</p>
              <p className="flex items-center gap-1.5 text-xs opacity-70">
                <span className="h-2 w-2 rounded-full bg-primary" /> Online · We typically reply in minutes
              </p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-secondary-foreground hover:bg-white/10" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {user ? (
            <>
              {/* Messages */}
              <div className="flex-1 space-y-3 overflow-y-auto bg-muted/30 p-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <Bot className="h-12 w-12 text-primary/40" />
                    <p className="mt-3 text-sm font-medium">Welcome to PesaCred Support</p>
                    <p className="mt-1 max-w-[260px] text-xs text-muted-foreground">
                      Hi! We&apos;re here to help. Ask us anything about your loan application,
                      payments, or account.
                    </p>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-border bg-card p-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1"
                  disabled={sendMutation.isPending}
                />
                <Button type="submit" size="icon" disabled={!input.trim() || sendMutation.isPending} className="shrink-0">
                  {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-muted/30 p-6 text-center">
              <Bot className="h-12 w-12 text-primary/40" />
              <div>
                <p className="text-sm font-semibold">Chat with our team</p>
                <p className="mt-1.5 max-w-[260px] text-xs text-muted-foreground">
                  Sign in to start a conversation with our support team. We typically reply within minutes.
                </p>
              </div>
              <div className="flex w-full flex-col gap-2">
                <Button asChild size="sm" className="w-full">
                  <Link href="/login">Sign in to chat</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="w-full">
                  <Link href="/register">Create an account</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isClient = message.sender === 'client';

  if (!isClient) {
    return (
      <div className="flex items-start gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Bot className="h-4 w-4" />
        </span>
        <div className="max-w-[75%]">
          <div className="rounded-2xl rounded-tl-sm bg-card px-3.5 py-2.5 text-sm shadow-soft">
            {message.message}
          </div>
          <p className="mt-1 pl-1 text-[10px] text-muted-foreground">{formatRelativeTime(message.created_at)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 justify-end">
      <div className="max-w-[75%]">
        <div className="rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2.5 text-sm text-primary-foreground shadow-soft">
          {message.message}
        </div>
        <p className="mt-1 pr-1 text-right text-[10px] text-muted-foreground">{formatRelativeTime(message.created_at)}</p>
      </div>
    </div>
  );
}
