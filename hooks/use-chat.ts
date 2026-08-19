'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import type { ChatMessage, Profile } from '@/types/database';

export const chatKeys = {
  messages: ['chat-messages'] as const,
  adminConversations: ['admin-conversations'] as const,
  adminMessages: (userId: string) => ['admin-chat', userId] as const,
};

/** Insert a message into a sorted cache only if it's not already present (by id).
 *  Also replaces any matching temp message from an optimistic update. */
function upsertMessage(
  old: ChatMessage[] | undefined,
  newMsg: ChatMessage
): ChatMessage[] {
  if (!old) return [newMsg];
  if (old.some((m) => m.id === newMsg.id)) return old;
  const tempMatch = old.some(
    (m) => m.id.startsWith('temp-') && m.message === newMsg.message && m.sender === newMsg.sender
  );
  if (tempMatch) {
    return old.map((m) =>
      m.id.startsWith('temp-') && m.message === newMsg.message && m.sender === newMsg.sender
        ? newMsg
        : m
    );
  }
  return [...old, newMsg];
}

/** Client hook: get all messages for the current user's conversation */
export function useChatMessages() {
  const { user } = useAuth();
  return useQuery<ChatMessage[]>({
    queryKey: chatKeys.messages,
    enabled: !!user,
    queryFn: async (): Promise<ChatMessage[]> => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as ChatMessage[];
    },
  });
}

/** Client hook: send a message as the client (optimistic — appears instantly) */
export function useSendChatMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (message: string): Promise<ChatMessage> => {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({ sender: 'client', message })
        .select()
        .single();
      if (error) throw error;
      return data as ChatMessage;
    },
    onMutate: async (message: string) => {
      await qc.cancelQueries({ queryKey: chatKeys.messages });
      const previous = qc.getQueryData<ChatMessage[]>(chatKeys.messages);
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const tempMsg: ChatMessage = {
        id: tempId,
        user_id: '',
        sender: 'client',
        admin_id: null,
        message,
        read: false,
        created_at: new Date().toISOString(),
      };
      qc.setQueryData<ChatMessage[]>(chatKeys.messages, (old: ChatMessage[] | undefined) =>
        old ? [...old, tempMsg] : [tempMsg]
      );
      return { previous, tempId };
    },
    onError: (_err, _message, ctx) => {
      if (ctx?.previous) qc.setQueryData(chatKeys.messages, ctx.previous);
    },
    onSuccess: (realMsg, _message, ctx) => {
      qc.setQueryData<ChatMessage[]>(chatKeys.messages, (old: ChatMessage[] | undefined) => {
        if (!old) return [realMsg];
        return old.map((m) => (m.id === ctx?.tempId ? realMsg : m));
      });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: chatKeys.adminConversations });
    },
  });
}

/** Client hook: mark admin messages as read (optimistic) */
export function useMarkChatRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (messageIds: string[]) => {
      if (messageIds.length === 0) return;
      const { error } = await supabase
        .from('chat_messages')
        .update({ read: true })
        .in('id', messageIds);
      if (error) throw error;
    },
    onMutate: async (messageIds: string[]) => {
      await qc.cancelQueries({ queryKey: chatKeys.messages });
      const previous = qc.getQueryData<ChatMessage[]>(chatKeys.messages);
      qc.setQueryData<ChatMessage[]>(chatKeys.messages, (old: ChatMessage[] | undefined) => {
        if (!old) return old;
        return old.map((m) => (messageIds.includes(m.id) ? { ...m, read: true } : m));
      });
      return { previous };
    },
    onError: (_err, _ids, ctx) => {
      if (ctx?.previous) qc.setQueryData(chatKeys.messages, ctx.previous);
    },
  });
}

/** Admin hook: get list of all conversations (grouped by user) */
interface AdminConversation {
  user_id: string;
  profile: Profile | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  message_count: number;
}

export type { AdminConversation };

export function useAdminConversations() {
  return useQuery<AdminConversation[]>({
    queryKey: chatKeys.adminConversations,
    queryFn: async (): Promise<AdminConversation[]> => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*, profiles!chat_messages_user_id_fkey(*)')
        .order('created_at', { ascending: true });
      if (error) throw error;

      const allMessages = (data ?? []) as (ChatMessage & { profiles: Profile | null })[];
      const grouped = new Map<string, AdminConversation>();

      for (const msg of allMessages) {
        const existing = grouped.get(msg.user_id);
        const isAdminSender = msg.sender === 'admin';
        const isUnread = !msg.read && isAdminSender === false;

        if (!existing) {
          grouped.set(msg.user_id, {
            user_id: msg.user_id,
            profile: msg.profiles,
            last_message: msg.message,
            last_message_at: msg.created_at,
            unread_count: isUnread ? 1 : 0,
            message_count: 1,
          });
        } else {
          existing.message_count++;
          if (new Date(msg.created_at) > new Date(existing.last_message_at)) {
            existing.last_message = msg.message;
            existing.last_message_at = msg.created_at;
          }
          if (isUnread) existing.unread_count++;
        }
      }

      return Array.from(grouped.values()).sort(
        (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );
    },
  });
}

/** Admin hook: get messages for a specific user conversation */
export function useAdminChatMessages(userId: string | undefined) {
  return useQuery<ChatMessage[]>({
    queryKey: chatKeys.adminMessages(userId ?? ''),
    enabled: !!userId,
    queryFn: async (): Promise<ChatMessage[]> => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as ChatMessage[];
    },
  });
}

/** Admin hook: send a message as admin to a specific user (optimistic — appears instantly) */
export function useAdminSendChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, message }: { userId: string; message: string }): Promise<ChatMessage> => {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({ user_id: userId, sender: 'admin', message })
        .select()
        .single();
      if (error) throw error;
      return data as ChatMessage;
    },
    onMutate: async ({ userId, message }) => {
      const key = chatKeys.adminMessages(userId);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<ChatMessage[]>(key);
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const tempMsg: ChatMessage = {
        id: tempId,
        user_id: userId,
        sender: 'admin',
        admin_id: null,
        message,
        read: false,
        created_at: new Date().toISOString(),
      };
      qc.setQueryData<ChatMessage[]>(key, (old: ChatMessage[] | undefined) => (old ? [...old, tempMsg] : [tempMsg]));
      return { previous, tempId, userId };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(chatKeys.adminMessages(ctx.userId), ctx.previous);
    },
    onSuccess: (realMsg, vars, ctx) => {
      qc.setQueryData<ChatMessage[]>(chatKeys.adminMessages(vars.userId), (old: ChatMessage[] | undefined) => {
        if (!old) return [realMsg];
        return old.map((m) => (m.id === ctx?.tempId ? realMsg : m));
      });
    },
    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: chatKeys.adminConversations });
    },
  });
}

/** Admin hook: mark client messages as read (optimistic) */
export function useAdminMarkChatRead(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (messageIds: string[]) => {
      if (messageIds.length === 0) return;
      const { error } = await supabase
        .from('chat_messages')
        .update({ read: true })
        .in('id', messageIds);
      if (error) throw error;
    },
    onMutate: async (messageIds: string[]) => {
      if (!userId) return {};
      const key = chatKeys.adminMessages(userId);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<ChatMessage[]>(key);
      qc.setQueryData<ChatMessage[]>(key, (old: ChatMessage[] | undefined) => {
        if (!old) return old;
        return old.map((m) => (messageIds.includes(m.id) ? { ...m, read: true } : m));
      });
      return { previous };
    },
    onError: (_err, _ids, ctx) => {
      if (ctx?.previous && userId) qc.setQueryData(chatKeys.adminMessages(userId), ctx.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: chatKeys.adminConversations });
    },
  });
}

/** Hook: subscribe to realtime updates for the client's chat.
 *  Patches new messages directly into the cache for instant display.
 *  Filtered by user_id so the client only receives their own conversation. */
export function useChatRealtime(userId?: string) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`chat-realtime-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `user_id=eq.${userId}` },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          qc.setQueryData<ChatMessage[]>(chatKeys.messages, (old: ChatMessage[] | undefined) =>
            upsertMessage(old, newMsg)
          );
          qc.invalidateQueries({ queryKey: chatKeys.adminConversations });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_messages', filter: `user_id=eq.${userId}` },
        (payload) => {
          const updatedMsg = payload.new as ChatMessage;
          qc.setQueryData<ChatMessage[]>(chatKeys.messages, (old: ChatMessage[] | undefined) => {
            if (!old) return old;
            return old.map((m) => (m.id === updatedMsg.id ? updatedMsg : m));
          });
          qc.invalidateQueries({ queryKey: chatKeys.adminConversations });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc, userId]);
}

/** Hook: subscribe to realtime updates for admin's specific conversation.
 *  Patches new messages directly into the cache for instant display. */
export function useAdminChatRealtime(userId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`admin-chat-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        if (newMsg.user_id !== userId) return;
        qc.setQueryData<ChatMessage[]>(chatKeys.adminMessages(userId), (old: ChatMessage[] | undefined) => upsertMessage(old, newMsg));
        qc.invalidateQueries({ queryKey: chatKeys.adminConversations });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages' }, (payload) => {
        const updatedMsg = payload.new as ChatMessage;
        if (updatedMsg.user_id !== userId) return;
        qc.setQueryData<ChatMessage[]>(chatKeys.adminMessages(userId), (old: ChatMessage[] | undefined) => {
          if (!old) return old;
          return old.map((m) => (m.id === updatedMsg.id ? updatedMsg : m));
        });
        qc.invalidateQueries({ queryKey: chatKeys.adminConversations });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc, userId]);
}
