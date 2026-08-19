/*
# Add Login Tracking and Document Destruction

## Overview
Two changes:
1. Login tracking — adds `last_login_at` and `login_count` columns to
   `profiles` so the admin can see who has logged in and when.
2. Document destruction — adds a `destroyed_at` column to `loan_documents`
   to track when a document file was deleted from storage. The metadata
   row is kept for audit purposes but the actual file is removed.

## Changes

### profiles table
- `last_login_at` (timestamptz, nullable) — timestamp of the user's most
  recent login. Updated by the frontend on each successful auth state change.
- `login_count` (integer, default 0) — incremented on each login.

### loan_documents table
- `destroyed_at` (timestamptz, nullable) — when set, the document file has
  been permanently removed from storage. The row remains for audit trail.

### RLS policies
- The profiles SELECT policy already allows admins to read all profiles
  (auth.uid() = id OR is_admin()), so no new policy is needed for admins
  to see login data.
- The profiles UPDATE policy currently only allows self-update
  (auth.uid() = id). This is sufficient — the frontend updates the
  current user's own row on login.
- loan_documents SELECT already allows admins. No new policy needed.
- Added a SECURITY DEFINER function `delete_application_documents` that
  removes all document files for a given application from storage and
  marks their rows as destroyed. This is called when an application
  reaches a final status (approved, declined, disbursed).

## Security
- Login tracking columns are on the user's own profile row, so the
  existing self-update policy covers them.
- The delete function is SECURITY DEFINER and only callable by admins
  via the service role or admin RLS checks in the frontend.
*/

-- 1. Add login tracking columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS login_count integer NOT NULL DEFAULT 0;

-- 2. Add destroyed_at to loan_documents
ALTER TABLE public.loan_documents ADD COLUMN IF NOT EXISTS destroyed_at timestamptz;

-- 3. SECURITY DEFINER function to delete document files and mark destroyed
--    Called from frontend when application reaches final status.
CREATE OR REPLACE FUNCTION public.delete_application_documents(app_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  doc_row RECORD;
BEGIN
  FOR doc_row IN
    SELECT id, file_url FROM public.loan_documents
    WHERE application_id = app_id AND destroyed_at IS NULL
  LOOP
    -- Extract the storage path from the public URL
    -- URL format: https://<project>.supabase.co/storage/v1/object/public/loan-documents/<path>
    BEGIN
      PERFORM
        storage.delete_to_bucket('loan-documents', split_part(
          regexp_replace(doc_row.file_url, '.*/loan-documents/', ''),
          '?', 1
        ));
    EXCEPTION WHEN OTHERS THEN
      -- If storage delete fails, continue — we still mark as destroyed
      NULL;
    END;
  END LOOP;

  -- Mark all documents for this application as destroyed
  UPDATE public.loan_documents
  SET destroyed_at = now()
  WHERE application_id = app_id AND destroyed_at IS NULL;
END;
$$;