/*
# Create record_login function

## Overview
Creates a SECURITY DEFINER function that updates the user's last_login_at
timestamp and increments login_count. Called from the frontend on each
SIGNED_IN event.

## Security
- SECURITY DEFINER so it can update profiles even though the onAuthStateChange
  callback may run before the session is fully established.
- Only updates the calling user's own row (auth.uid() = user_id param).
*/

CREATE OR REPLACE FUNCTION public.record_login(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    last_login_at = now(),
    login_count = login_count + 1
  WHERE id = user_id AND id = auth.uid();
END;
$$;