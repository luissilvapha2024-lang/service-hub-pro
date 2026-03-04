-- Fix: Make order-photos bucket private and update storage policies
UPDATE storage.buckets SET public = false WHERE id = 'order-photos';

-- Drop the public access policy
DROP POLICY IF EXISTS "Anyone can view order photos" ON storage.objects;

-- Add authenticated-only SELECT policy
CREATE POLICY "Authenticated users can view order photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'order-photos' AND auth.uid() IS NOT NULL);