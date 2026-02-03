-- Create a secure view for companies that masks CNPJ for non-admins
CREATE OR REPLACE VIEW public.companies_safe
WITH (security_invoker = on) AS
SELECT 
  id,
  name,
  CASE 
    WHEN has_role(auth.uid(), 'admin') THEN cnpj
    ELSE CONCAT(LEFT(cnpj, 2), '.***/****-**')
  END AS cnpj,
  phone,
  address,
  logo_url,
  is_active,
  access_expires_at,
  created_at,
  updated_at
FROM public.companies;

-- Create a secure view for clients that hides CPF for non-admins
CREATE OR REPLACE VIEW public.clients_safe
WITH (security_invoker = on) AS
SELECT 
  id,
  name,
  phone,
  CASE 
    WHEN has_role(auth.uid(), 'admin') THEN email
    ELSE NULL
  END AS email,
  CASE 
    WHEN has_role(auth.uid(), 'admin') THEN cpf
    ELSE NULL
  END AS cpf,
  CASE 
    WHEN has_role(auth.uid(), 'admin') THEN address
    ELSE NULL
  END AS address,
  notes,
  company_id,
  user_id,
  created_at,
  updated_at
FROM public.clients;

-- Grant access to authenticated users
GRANT SELECT ON public.companies_safe TO authenticated;
GRANT SELECT ON public.clients_safe TO authenticated;