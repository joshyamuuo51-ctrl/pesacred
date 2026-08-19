/*
# Auto-create profile on signup + repair missing profiles

## Overview
Two critical fixes:
1. Creates a database trigger `handle_new_user` that automatically inserts
   a row into `public.profiles` whenever a new user signs up via Supabase
   Auth. This fixes the race condition where the frontend manual insert
   fails (e.g. due to RLS timing or network issues), leaving the user
   with an auth account but no profile — which breaks name display,
   admin access, and all profile-dependent features.
2. Creates a `repair_profile` SECURITY DEFINER function that the frontend
   can call to create a missing profile row using auth.users metadata,
   as a fallback for existing users who already have auth accounts but
   no profile row.

## How it works
- The trigger fires AFTER INSERT on `auth.users` (the internal Supabase
  auth table). It reads `raw_user_meta_data` for the full_name, phone,
  national_id, and date_of_birth that were passed to `supabase.auth.signUp()`.
- If those fields are missing (e.g. for users created before the trigger),
  it uses the email from auth.users and sensible defaults.
- The `repair_profile` function is callable by the authenticated user
  themselves — it creates their own profile if it doesn't exist yet,
  using their JWT metadata and email.

## Security
- The trigger function is SECURITY DEFINER (runs as postgres) so it can
  insert into profiles regardless of RLS.
- `repair_profile` is SECURITY DEFINER but only creates a row for
  auth.uid() — it cannot touch other users' profiles.
- The profiles INSERT policy (`insert_own_profile`) already allows
  authenticated users to insert their own row, so the manual insert
  in the register page still works as a secondary path.
*/

-- 1. Create the trigger function that auto-creates a profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, national_id, date_of_birth, phone, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'national_id', '00000000'),
    COALESCE(NEW.raw_user_meta_data->>'date_of_birth', '1990-01-01')::date,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2. Attach the trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Create repair_profile function for existing users with missing profiles
CREATE OR REPLACE FUNCTION public.repair_profile()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_email text;
  current_meta jsonb;
BEGIN
  SELECT email, raw_user_meta_data INTO current_email, current_meta
  FROM auth.users WHERE id = auth.uid();

  IF current_email IS NULL THEN RETURN; END IF;

  INSERT INTO public.profiles (id, full_name, national_id, date_of_birth, phone, email)
  VALUES (
    auth.uid(),
    COALESCE(current_meta->>'full_name', split_part(current_email, '@', 1)),
    COALESCE(current_meta->>'national_id', '00000000'),
    COALESCE(current_meta->>'date_of_birth', '1990-01-01')::date,
    COALESCE(current_meta->>'phone', ''),
    current_email
  )
  ON CONFLICT (id) DO NOTHING;
END;
$$;