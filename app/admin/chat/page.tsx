'use client';

import { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Loader2,
  Search,
  ArrowLeft,
  Bot,
  User as UserIcon,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin-sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn, formatRelativeTime, initials } from '@/lib/utils';
import {
  useAdminConversations,
  useAdminChatMessages,
  useAdminSendChat,
  useAdminMarkChatRead,
  useAdminChatRealtime,
  type AdminConversation,
} from '@/hooks/use-chat';
import type { ChatMessage } from '@/types/database';

export default function AdminChatPage() {
  const { data: convData, isLoading } = useAdminConversations();
  const conversations: AdminConversation[] = convData ?? [];
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filteredConversations = (conversations ?? []).filter(
    (c) =>
      c.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.profile?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Live Chat"
        subtitle="Respond to client questions in real time."
      />

      <div className="grid gap-4 lg:grid-cols-[320px_1fr] h-[calc(100vh-280px)] min-h-[400px]">
        {/* Conversation list */}
        <Card className="flex flex-col overflow-hidden shadow-soft">
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">No conversations</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.user_id}
                  onClick={() => setSelectedUserId(conv.user_id)}
                  className={cn(
                    'flex w-full items-start gap-3 border-b border-border/60 p-3 text-left transition-colors hover:bg-muted/50',
                    selectedUserId === conv.user_id && 'bg-primary/5'
                  )}
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {conv.profile ? initials(conv.profile.full_name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-sm font-medium">{conv.profile?.full_name ?? 'Unknown'}</p>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {formatRelativeTime(conv.last_message_at)}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{conv.last_message}</p>
                    <div className="mt-1 flex items-center gap-2">
                      {conv.unread_count > 0 && (
                        <Badge className="h-5 px-1.5 text-[10px] bg-primary text-primary-foreground">
                          {conv.unread_count} new
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground">{conv.message_count} messages</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>

        {/* Message thread */}
        {selectedUserId ? (
          <ChatThread userId={selectedUserId} />
        ) : (
          <Card className="flex flex-col items-center justify-center shadow-soft">
            <CardContent className="py-20 text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <MessageSquare className="h-8 w-8 text-primary" />
              </span>
              <p className="mt-4 font-medium">Select a conversation</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose a conversation from the list to view and respond to messages.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function ChatThread({ userId }: { userId: string }) {
  const { data: msgData, isLoading } = useAdminChatMessages(userId);
  const messages: ChatMessage[] = msgData ?? [];
  const sendMutation = useAdminSendChat();
  const markRead = useAdminMarkChatRead(userId);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useAdminChatRealtime(userId);

  const chatMessages: ChatMessage[] = messages ?? [];
  const unreadClientMessages = chatMessages.filter((m) => m.sender === 'client' && !m.read);

  useEffect(() => {
    if (unreadClientMessages.length > 0) {
      markRead.mutate(unreadClientMessages.map((m) => m.id));
    }
  }, [unreadClientMessages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sendMutation.isPending) return;
    sendMutation.mutate(
      { userId, message: input.trim() },
      {
        onSuccess: () => setInput(''),
        onError: (err) => {
          import('sonner').then(({ toast }) =>
            toast.error(err instanceof Error ? err.message : 'Failed to send message')
          );
        },
      }
    );
  };

  return (
    <Card className="flex flex-col overflow-hidden shadow-soft">
      {/* Thread header */}
      <div className="flex items-center gap-3 border-b border-border p-4">
        <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden" onClick={() => history.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        {(() => {
          const conv = chatMessages;
          const lastWithProfile = conv.length > 0;
          return (
            <>
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {lastWithProfile ? <UserIcon className="h-5 w-5" /> : 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold">Client Conversation</p>
                <p className="text-xs text-muted-foreground">{chatMessages.length} messages</p>
              </div>
            </>
          );
        })()}
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto bg-muted/30 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : chatMessages.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">No messages in this conversation</p>
          </div>
        ) : (
          chatMessages.map((msg) => {
            const isAdmin = msg.sender === 'admin';
            return (
              <div key={msg.id} className={cn('flex items-start gap-2', isAdmin && 'justify-end')}>
                {!isAdmin && (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                    <UserIcon className="h-4 w-4" />
                  </span>
                )}
                <div className={cn('max-w-[70%]')}>
                  <div
                    className={cn(
                      'rounded-2xl px-3.5 py-2.5 text-sm shadow-soft',
                      isAdmin
                        ? 'rounded-tr-sm bg-primary text-primary-foreground'
                        : 'rounded-tl-sm bg-card'
                    )}
                  >
                    {msg.message}
                  </div>
                  <p
                    className={cn(
                      'mt-1 text-[10px] text-muted-foreground',
                      isAdmin ? 'pr-1 text-right' : 'pl-1'
                    )}
                  >
                    {formatRelativeTime(msg.created_at)}
                  </p>
                </div>
                {isAdmin && (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Bot className="h-4 w-4" />
                  </span>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-border p-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your reply..."
          className="flex-1"
          disabled={sendMutation.isPending}
        />
        <Button type="submit" size="icon" disabled={!input.trim() || sendMutation.isPending} className="shrink-0">
          {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </Card>
  );
}
