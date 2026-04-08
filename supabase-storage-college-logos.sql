-- =============================================================================
-- College logo uploads — Storage RLS for bucket named `documents`, path college-logos/
-- =============================================================================
-- Match the `documents` bucket whether `storage.objects.bucket_id` stores the
-- bucket UUID/id or the literal name `documents` (depends on Supabase version).
--
-- Run this entire script in Supabase → SQL Editor.
-- Safe to re-run: drops policies by name first, then recreates them.
--
-- Before running, confirm the bucket exists (name must be exactly `documents`):
--   SELECT id, name, public FROM storage.buckets WHERE name = 'documents';
-- If no row: Storage → New bucket → name: documents → Create
-- =============================================================================

-- Remove old policies so you can re-apply after fixes
DROP POLICY IF EXISTS "documents_college_logos_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "documents_college_logos_update_own" ON storage.objects;
DROP POLICY IF EXISTS "documents_college_logos_delete_own" ON storage.objects;
DROP POLICY IF EXISTS "documents_college_logos_select_anon" ON storage.objects;
DROP POLICY IF EXISTS "documents_college_logos_select_authenticated" ON storage.objects;

-- Path checks use split_part (object key is college-logos/<uid>/file.ext — no leading slash).

-- Upload: only college-logos/<your auth uid>/...
CREATE POLICY "documents_college_logos_insert_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  (
    bucket_id::text IN (SELECT b.id::text FROM storage.buckets b WHERE b.name = 'documents')
    OR bucket_id::text = 'documents'
  )
  AND split_part(name, '/', 1) = 'college-logos'
  AND split_part(name, '/', 2) = (SELECT auth.uid()::text)
);

CREATE POLICY "documents_college_logos_update_own"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  (
    bucket_id::text IN (SELECT b.id::text FROM storage.buckets b WHERE b.name = 'documents')
    OR bucket_id::text = 'documents'
  )
  AND split_part(name, '/', 1) = 'college-logos'
  AND split_part(name, '/', 2) = (SELECT auth.uid()::text)
)
WITH CHECK (
  (
    bucket_id::text IN (SELECT b.id::text FROM storage.buckets b WHERE b.name = 'documents')
    OR bucket_id::text = 'documents'
  )
  AND split_part(name, '/', 1) = 'college-logos'
  AND split_part(name, '/', 2) = (SELECT auth.uid()::text)
);

CREATE POLICY "documents_college_logos_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (
  (
    bucket_id::text IN (SELECT b.id::text FROM storage.buckets b WHERE b.name = 'documents')
    OR bucket_id::text = 'documents'
  )
  AND split_part(name, '/', 1) = 'college-logos'
  AND split_part(name, '/', 2) = (SELECT auth.uid()::text)
);

-- Public read (for <img> with public URLs when bucket is public)
CREATE POLICY "documents_college_logos_select_anon"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (
  (
    bucket_id::text IN (SELECT b.id::text FROM storage.buckets b WHERE b.name = 'documents')
    OR bucket_id::text = 'documents'
  )
  AND split_part(name, '/', 1) = 'college-logos'
);

-- Signed URLs / in-app reads for any logged-in user (parents, counselors)
CREATE POLICY "documents_college_logos_select_authenticated"
ON storage.objects FOR SELECT
TO authenticated
USING (
  (
    bucket_id::text IN (SELECT b.id::text FROM storage.buckets b WHERE b.name = 'documents')
    OR bucket_id::text = 'documents'
  )
  AND split_part(name, '/', 1) = 'college-logos'
);

-- Troubleshooting: if uploads still fail, run in SQL Editor:
--   SELECT column_name, data_type
--   FROM information_schema.columns
--   WHERE table_schema = 'storage' AND table_name = 'objects' AND column_name IN ('bucket_id','name');
--   SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
