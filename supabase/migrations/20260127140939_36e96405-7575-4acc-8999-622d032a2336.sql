-- Fix security issues: Add authentication checks to RLS policies

-- 1. Fix CLIENTS table - require authentication
DROP POLICY IF EXISTS "Users can manage company clients" ON public.clients;
DROP POLICY IF EXISTS "Superadmin can view all clients" ON public.clients;

CREATE POLICY "Users can manage company clients" 
ON public.clients FOR ALL 
USING (
  auth.uid() IS NOT NULL 
  AND company_id = get_user_company_id(auth.uid())
);

CREATE POLICY "Superadmin can view all clients" 
ON public.clients FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND is_superadmin(auth.uid())
);

-- 2. Fix PROFILES table - require authentication
DROP POLICY IF EXISTS "Users can view company profiles" ON public.profiles;
DROP POLICY IF EXISTS "Superadmin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view company profiles" 
ON public.profiles FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND ((company_id = get_user_company_id(auth.uid())) OR (auth.uid() = user_id))
);

CREATE POLICY "Superadmin can view all profiles" 
ON public.profiles FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND is_superadmin(auth.uid())
);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 3. Fix TRANSACTIONS table - require authentication
DROP POLICY IF EXISTS "Users can manage company transactions" ON public.transactions;
DROP POLICY IF EXISTS "Superadmin can view all transactions" ON public.transactions;

CREATE POLICY "Users can manage company transactions" 
ON public.transactions FOR ALL 
USING (
  auth.uid() IS NOT NULL 
  AND company_id = get_user_company_id(auth.uid())
);

CREATE POLICY "Superadmin can view all transactions" 
ON public.transactions FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND is_superadmin(auth.uid())
);

-- 4. Fix COMPANIES table - remove unrestricted policy and add secure ones
DROP POLICY IF EXISTS "Anyone can check company exists by CNPJ" ON public.companies;
DROP POLICY IF EXISTS "Users can view own company" ON public.companies;
DROP POLICY IF EXISTS "Users can update own company" ON public.companies;
DROP POLICY IF EXISTS "Superadmin can view all companies" ON public.companies;
DROP POLICY IF EXISTS "Superadmin can update all companies" ON public.companies;

CREATE POLICY "Users can view own company" 
ON public.companies FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND id = get_user_company_id(auth.uid())
);

CREATE POLICY "Users can update own company" 
ON public.companies FOR UPDATE 
USING (
  auth.uid() IS NOT NULL 
  AND id = get_user_company_id(auth.uid())
);

CREATE POLICY "Superadmin can view all companies" 
ON public.companies FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND is_superadmin(auth.uid())
);

CREATE POLICY "Superadmin can update all companies" 
ON public.companies FOR UPDATE 
USING (
  auth.uid() IS NOT NULL 
  AND is_superadmin(auth.uid())
);

-- Create secure function for CNPJ lookup (returns only boolean, not data)
CREATE OR REPLACE FUNCTION public.check_cnpj_exists(_cnpj text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.companies 
    WHERE cnpj = _cnpj 
    AND is_active = true
  )
$$;