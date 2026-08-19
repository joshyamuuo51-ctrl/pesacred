/*
# Enable Realtime for Chat Messages and Notifications

## Overview
The `supabase_realtime` publication was empty — no tables were broadcasting
change events. This meant the chat realtime subscriptions (which listen for
INSERT/UPDATE on `chat_messages`) never received any events, so recipients
had to manually refresh to see new messages or notifications.

## Changes
1. Add `chat_messages` to the `supabase_realtime` publication so INSERT and
   UPDATE events are broadcast to all subscribed clients.
2. Add `notifications` to the `supabase_realtime` publication so new
   notifications appear instantly in the user's notification panel without
   a manual refresh.

## Security
- No RLS or policy changes. RLS still governs which rows each client can see
  over realtime — the publication only enables broadcasting; row-level
  filtering is unchanged.
- These tables already have RLS enabled with proper ownership/admin policies.

## Notes
1. This is idempotent — safe to re-run.
2. After this change, any authenticated client subscribed to
   `postgres_changes` on these tables will receive events in real time.
*/

DO $$
BEGIN
  -- chat_messages
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  END IF;

  -- notifications
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;