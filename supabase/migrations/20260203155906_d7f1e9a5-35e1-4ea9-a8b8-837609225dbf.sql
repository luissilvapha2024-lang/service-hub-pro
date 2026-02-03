-- Block anonymous access to profiles table
CREATE POLICY "Block anonymous access to profiles"
ON public.profiles FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Block anonymous access to companies table  
CREATE POLICY "Block anonymous access to companies"
ON public.companies FOR SELECT
USING (auth.uid() IS NOT NULL);