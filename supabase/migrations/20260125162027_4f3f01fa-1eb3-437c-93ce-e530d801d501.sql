-- Tabela para armazenar permissões personalizadas por empresa
CREATE TABLE public.company_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL,
  role public.app_role NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, permission_key, role)
);

-- Enable RLS
ALTER TABLE public.company_permissions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view company permissions"
ON public.company_permissions FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can manage company permissions"
ON public.company_permissions FOR ALL
USING (
  company_id = get_user_company_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
);

-- Trigger para updated_at
CREATE TRIGGER update_company_permissions_updated_at
BEFORE UPDATE ON public.company_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir permissões padrão para empresas existentes
INSERT INTO public.company_permissions (company_id, permission_key, role, enabled)
SELECT c.id, 'ver_financeiro', 'admin'::public.app_role, true FROM public.companies c
UNION ALL
SELECT c.id, 'ver_financeiro', 'tecnico'::public.app_role, false FROM public.companies c
UNION ALL
SELECT c.id, 'ver_financeiro', 'caixa'::public.app_role, true FROM public.companies c
UNION ALL
SELECT c.id, 'ver_relatorios', 'admin'::public.app_role, true FROM public.companies c
UNION ALL
SELECT c.id, 'ver_relatorios', 'tecnico'::public.app_role, false FROM public.companies c
UNION ALL
SELECT c.id, 'ver_relatorios', 'caixa'::public.app_role, false FROM public.companies c
UNION ALL
SELECT c.id, 'dar_desconto', 'admin'::public.app_role, true FROM public.companies c
UNION ALL
SELECT c.id, 'dar_desconto', 'tecnico'::public.app_role, false FROM public.companies c
UNION ALL
SELECT c.id, 'dar_desconto', 'caixa'::public.app_role, true FROM public.companies c
UNION ALL
SELECT c.id, 'excluir_os', 'admin'::public.app_role, true FROM public.companies c
UNION ALL
SELECT c.id, 'excluir_os', 'tecnico'::public.app_role, false FROM public.companies c
UNION ALL
SELECT c.id, 'excluir_os', 'caixa'::public.app_role, false FROM public.companies c
ON CONFLICT (company_id, permission_key, role) DO NOTHING;