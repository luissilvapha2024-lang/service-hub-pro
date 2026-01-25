-- Criar a empresa com o CNPJ especificado
INSERT INTO public.companies (cnpj, name)
VALUES ('12345678000190', 'Empresa TechFix')
ON CONFLICT (cnpj) DO NOTHING;

-- Atualizar o perfil do usuário com o company_id
UPDATE public.profiles
SET 
  company_id = (SELECT id FROM public.companies WHERE cnpj = '12345678000190'),
  company_cnpj = '12345678000190'
WHERE user_id = 'a0deff3e-f8d3-46df-95a1-9ad74beb107b';

-- Atualizar o user_role com o company_id
UPDATE public.user_roles
SET company_id = (SELECT id FROM public.companies WHERE cnpj = '12345678000190')
WHERE user_id = 'a0deff3e-f8d3-46df-95a1-9ad74beb107b';