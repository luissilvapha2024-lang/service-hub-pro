-- Fix the function with mutable search_path
CREATE OR REPLACE FUNCTION public.login_company_by_cnpj(p_cnpj text)
 RETURNS TABLE(id uuid, is_active boolean, access_expires_at timestamp with time zone)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    id,
    is_active,
    access_expires_at
  from companies
  where cnpj = p_cnpj
  limit 1;
$function$;