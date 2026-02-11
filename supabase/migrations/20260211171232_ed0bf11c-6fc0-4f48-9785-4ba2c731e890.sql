
-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their company logo
CREATE POLICY "Users can upload company logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'company-logos'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = get_user_company_id(auth.uid())::text
);

-- Allow public read access to company logos
CREATE POLICY "Company logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-logos');

-- Allow users to update/delete their company logos
CREATE POLICY "Users can update company logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'company-logos'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = get_user_company_id(auth.uid())::text
);

CREATE POLICY "Users can delete company logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'company-logos'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = get_user_company_id(auth.uid())::text
);
