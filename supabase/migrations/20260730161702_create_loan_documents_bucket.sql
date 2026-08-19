/*
# Create loan-documents storage bucket policies

1. Storage
- Ensures the 'loan-documents' bucket exists and is public (files are
  readable by anyone via their public URL, which is needed so applicants
  and admins can view/download uploaded documents).

2. Security (storage policies)
- SELECT (read): public — anyone with the URL can read a file. This is
  required because getPublicUrl returns a non-signed URL.
- INSERT: authenticated users can upload to the bucket. RLS on the
  loan_documents table ensures only the file owner's row is visible.
- UPDATE / DELETE: restricted to the file owner (auth.uid() = owner)
  and admins via the owner column.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('loan-documents', 'loan-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access for the bucket
DROP POLICY IF EXISTS "loan_docs_public_read" ON storage.objects;
CREATE POLICY "loan_docs_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'loan-documents');

-- Authenticated users can upload
DROP POLICY IF EXISTS "loan_docs_auth_insert" ON storage.objects;
CREATE POLICY "loan_docs_auth_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'loan-documents');

-- Authenticated users can update their own files (owner column set on upload)
DROP POLICY IF EXISTS "loan_docs_auth_update" ON storage.objects;
CREATE POLICY "loan_docs_auth_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'loan-documents' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'loan-documents');

-- Authenticated users can delete their own files
DROP POLICY IF EXISTS "loan_docs_auth_delete" ON storage.objects;
CREATE POLICY "loan_docs_auth_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'loan-documents' AND owner = auth.uid());
