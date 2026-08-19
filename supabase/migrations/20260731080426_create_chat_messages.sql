/*
# Create chat_messages table for live chat between clients and admins

## Overview
Adds a chat_messages table to support real-time messaging between
applicants (clients) and admin staff. Messages are scoped per user
so each client has one conversation thread with the support team.

## New Table
- chat_messages
  - id (uuid PK)
  - user_id (uuid, FK to profiles, defaults to auth.uid()) — the client
  - sender ('client' | 'admin') — who sent the message
  - admin_id (uuid, nullable, FK to profiles) — which admin responded
  - message (text) — the message content
  - read (boolean, default false) — whether the recipient has seen it
  - created_at (timestamptz)

## Security
- RLS enabled.
- Clients can SELECT, INSERT their own messages (auth.uid() = user_id).
- Admins can SELECT all messages and INSERT as admin (sender = 'admin').
- Clients can UPDATE read status on their own messages.
- Admins can UPDATE read status on all messages.

## Notes
- user_id defaults to auth.uid() so client inserts work without passing it.
- An index on user_id + created_at powers the conversation view efficiently.
*/

DO $$ BEGIN
  CREATE TYPE chat_sender AS ENUM ('client', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender chat_sender NOT NULL DEFAULT 'client',
  admin_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_user ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_created ON public.chat_messages(user_id, created_at);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Clients can read their own messages
DROP POLICY IF EXISTS "select_own_chat" ON public.chat_messages;
CREATE POLICY "select_own_chat" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- Clients can send messages as 'client'; admins can send as 'admin'
DROP POLICY IF EXISTS "insert_chat" ON public.chat_messages;
CREATE POLICY "insert_chat" ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.uid() = user_id AND sender = 'client')
    OR public.is_admin()
  );

-- Both clients and admins can update read status
DROP POLICY IF EXISTS "update_chat" ON public.chat_messages;
CREATE POLICY "update_chat" ON public.chat_messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- Clients can delete their own messages
DROP POLICY IF EXISTS "delete_own_chat" ON public.chat_messages;
CREATE POLICY "delete_own_chat" ON public.chat_messages
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
