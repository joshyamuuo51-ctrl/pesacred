/*
# Fix document deletion function and storage policy

## Overview
1. Fixes the delete_application_documents function to use the correct
   storage.objects table for file deletion.
2. Updates the storage DELETE policy to allow admins to delete document
   files (needed for the frontend approach as a fallback).

## Security
- Admins can now delete any file in the loan-documents bucket.
- The SECURITY DEFINER function bypasses RLS entirely (runs as postgres).
*/

-- Fix the function to delete from storage.objects directly
CREATE OR REPLACE FUNCTION public.delete_application_documents(app_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  doc_row RECORD;
  storage_path text;
BEGIN
  FOR doc_row IN
    SELECT id, file_url FROM public.loan_documents
    WHERE application_id = app_id AND destroyed_at IS NULL
  LOOP
    -- Extract the storage path from the public URL
    -- URL format: https://<project>.supabase.co/storage/v1/object/public/loan-documents/<path>
    storage_path := regexp_replace(doc_row.file_url, '.*/loan-documents/', '');
    storage_path := split_part(storage_path, '?', 1);

    -- Delete the file from storage
    DELETE FROM storage.objects WHERE bucket_id = 'loan-documents' AND name = storage_path;
  END LOOP;

  -- Mark all documents for this application as destroyed
  UPDATE public.loan_documents
  SET destroyed_at = now()
  WHERE application_id = app_id AND destroyed_at IS NULL;
END;
$$;

-- Allow admins to delete files in the loan-documents bucket
DROP POLICY IF EXISTS "loan_docs_auth_delete" ON storage.objects;
DROP POLICY IF EXISTS "loan_docs_admin_delete" ON storage.objects;
CREATE POLICY "loan_docs_auth_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'loan-documents' AND (owner = auth.uid() OR public.is_staff()));