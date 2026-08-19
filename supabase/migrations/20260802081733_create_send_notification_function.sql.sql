/*
# Create send_notification function for admin-to-user notifications

## Overview
Adds a SECURITY DEFINER function that lets an admin insert a notification
for any user. The existing notifications INSERT RLS policy only allows
auth.uid() = user_id, so a client-side admin cannot create notifications
targeting other users. This function bypasses RLS to do so safely.

## Security
- SECURITY DEFINER, owned by postgres.
- Only callable by authenticated admins (is_admin() check).
- Takes target_user_id from the argument but validates the caller is an admin.
- Search path is pinned to public.
*/

CREATE OR REPLACE FUNCTION public.send_notification(
  target_user_id uuid,
  notif_title text,
  notif_message text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Permission denied: admin access required';
  END IF;

  INSERT INTO public.notifications (user_id, title, message)
  VALUES (target_user_id, notif_title, notif_message);
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_notification(uuid, text, text) TO authenticated;