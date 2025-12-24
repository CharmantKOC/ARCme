-- Fix Storage bucket and policies for documents
-- This allows authenticated users to access PDFs

-- Solution 1: Make the bucket public (RECOMMENDED for this use case)
-- Execute this in Supabase Dashboard → Storage → documents bucket → Make Public

-- Solution 2: Update storage policies to allow authenticated read access
-- This is an alternative if you want to keep the bucket private

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated read access" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;

-- Allow all authenticated users to read documents
CREATE POLICY "Authenticated users can read documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

-- Keep existing upload policy (users can upload to their own folder)
-- This should already exist from the migration

-- Allow authenticated users to download documents
CREATE POLICY "Authenticated users can download documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

-- Verify the policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE '%documents%'
ORDER BY policyname;
