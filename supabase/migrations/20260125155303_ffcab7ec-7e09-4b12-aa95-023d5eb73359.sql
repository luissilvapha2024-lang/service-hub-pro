-- Permitir que admins atualizem roles de usuários da mesma empresa
CREATE POLICY "Admins can manage company user roles"
ON public.user_roles FOR UPDATE
USING (
  company_id = get_user_company_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
);

-- Permitir que admins insiram novos roles (para novos usuários)
CREATE POLICY "Admins can insert company user roles"
ON public.user_roles FOR INSERT
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
);