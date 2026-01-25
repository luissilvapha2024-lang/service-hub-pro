-- Update the handle_new_user function to also create default permissions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _company_id UUID;
  _cnpj TEXT;
  _is_new_company BOOLEAN := false;
BEGIN
  -- Obter CNPJ dos metadados
  _cnpj := NEW.raw_user_meta_data->>'company_cnpj';
  
  -- Verificar se empresa já existe ou criar nova
  IF _cnpj IS NOT NULL AND _cnpj != '' THEN
    SELECT id INTO _company_id FROM public.companies WHERE cnpj = _cnpj;
    
    -- Se empresa não existe, criar
    IF _company_id IS NULL THEN
      INSERT INTO public.companies (cnpj, name)
      VALUES (_cnpj, COALESCE(NEW.raw_user_meta_data->>'company_name', 'Empresa'))
      RETURNING id INTO _company_id;
      
      _is_new_company := true;
    END IF;
  END IF;
  
  -- Criar perfil do usuário
  INSERT INTO public.profiles (user_id, name, email, company_id, company_cnpj)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    _company_id,
    _cnpj
  );
  
  -- Atribuir role padrão (admin se for primeiro usuário da empresa)
  INSERT INTO public.user_roles (user_id, role, company_id)
  VALUES (NEW.id, 'admin', _company_id);
  
  -- Se for uma nova empresa, criar permissões padrão
  IF _is_new_company AND _company_id IS NOT NULL THEN
    -- Permissões para ADMIN (todas habilitadas)
    INSERT INTO public.company_permissions (company_id, permission_key, role, enabled) VALUES
      (_company_id, 'ver_dashboard', 'admin', true),
      (_company_id, 'ver_clientes', 'admin', true),
      (_company_id, 'ver_servicos', 'admin', true),
      (_company_id, 'ver_produtos', 'admin', true),
      (_company_id, 'ver_ordens_servico', 'admin', true),
      (_company_id, 'ver_pdv', 'admin', true),
      (_company_id, 'ver_financeiro', 'admin', true),
      (_company_id, 'ver_relatorios', 'admin', true),
      (_company_id, 'ver_configuracoes', 'admin', true),
      (_company_id, 'dar_desconto', 'admin', true),
      (_company_id, 'excluir_os', 'admin', true);
    
    -- Permissões para TECNICO (acesso básico, sem financeiro/relatórios/configurações)
    INSERT INTO public.company_permissions (company_id, permission_key, role, enabled) VALUES
      (_company_id, 'ver_dashboard', 'tecnico', true),
      (_company_id, 'ver_clientes', 'tecnico', true),
      (_company_id, 'ver_servicos', 'tecnico', true),
      (_company_id, 'ver_produtos', 'tecnico', true),
      (_company_id, 'ver_ordens_servico', 'tecnico', true),
      (_company_id, 'ver_pdv', 'tecnico', false),
      (_company_id, 'ver_financeiro', 'tecnico', false),
      (_company_id, 'ver_relatorios', 'tecnico', false),
      (_company_id, 'ver_configuracoes', 'tecnico', false),
      (_company_id, 'dar_desconto', 'tecnico', false),
      (_company_id, 'excluir_os', 'tecnico', false);
    
    -- Permissões para CAIXA (PDV e financeiro, sem OS/relatórios)
    INSERT INTO public.company_permissions (company_id, permission_key, role, enabled) VALUES
      (_company_id, 'ver_dashboard', 'caixa', true),
      (_company_id, 'ver_clientes', 'caixa', true),
      (_company_id, 'ver_servicos', 'caixa', true),
      (_company_id, 'ver_produtos', 'caixa', true),
      (_company_id, 'ver_ordens_servico', 'caixa', false),
      (_company_id, 'ver_pdv', 'caixa', true),
      (_company_id, 'ver_financeiro', 'caixa', true),
      (_company_id, 'ver_relatorios', 'caixa', false),
      (_company_id, 'ver_configuracoes', 'caixa', false),
      (_company_id, 'dar_desconto', 'caixa', true),
      (_company_id, 'excluir_os', 'caixa', false);
  END IF;
  
  RETURN NEW;
END;
$function$;