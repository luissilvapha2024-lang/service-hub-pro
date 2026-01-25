-- Criar tabela de empresas
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cnpj TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Adicionar company_id às tabelas existentes
ALTER TABLE public.profiles ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.clients ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.products ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.services ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.service_orders ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.transactions ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.sales ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.user_roles ADD COLUMN company_id UUID REFERENCES public.companies(id);

-- Criar índices para performance
CREATE INDEX idx_profiles_company ON public.profiles(company_id);
CREATE INDEX idx_clients_company ON public.clients(company_id);
CREATE INDEX idx_products_company ON public.products(company_id);
CREATE INDEX idx_services_company ON public.services(company_id);
CREATE INDEX idx_service_orders_company ON public.service_orders(company_id);
CREATE INDEX idx_transactions_company ON public.transactions(company_id);
CREATE INDEX idx_sales_company ON public.sales(company_id);
CREATE INDEX idx_user_roles_company ON public.user_roles(company_id);

-- Função para obter company_id do usuário atual
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Políticas RLS para companies
CREATE POLICY "Users can view own company"
ON public.companies FOR SELECT
USING (id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Users can update own company"
ON public.companies FOR UPDATE
USING (id = public.get_user_company_id(auth.uid()));

-- Atualizar políticas de profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view company profiles"
ON public.profiles FOR SELECT
USING (company_id = public.get_user_company_id(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Atualizar políticas de clients
DROP POLICY IF EXISTS "Users can manage own clients" ON public.clients;

CREATE POLICY "Users can manage company clients"
ON public.clients FOR ALL
USING (company_id = public.get_user_company_id(auth.uid()));

-- Atualizar políticas de products
DROP POLICY IF EXISTS "Users can manage own products" ON public.products;

CREATE POLICY "Users can manage company products"
ON public.products FOR ALL
USING (company_id = public.get_user_company_id(auth.uid()));

-- Atualizar políticas de services
DROP POLICY IF EXISTS "Users can manage own services" ON public.services;

CREATE POLICY "Users can manage company services"
ON public.services FOR ALL
USING (company_id = public.get_user_company_id(auth.uid()));

-- Atualizar políticas de service_orders
DROP POLICY IF EXISTS "Users can manage own orders" ON public.service_orders;

CREATE POLICY "Users can manage company orders"
ON public.service_orders FOR ALL
USING (company_id = public.get_user_company_id(auth.uid()));

-- Atualizar políticas de transactions
DROP POLICY IF EXISTS "Users can manage own transactions" ON public.transactions;

CREATE POLICY "Users can manage company transactions"
ON public.transactions FOR ALL
USING (company_id = public.get_user_company_id(auth.uid()));

-- Atualizar políticas de sales
DROP POLICY IF EXISTS "Users can manage own sales" ON public.sales;

CREATE POLICY "Users can manage company sales"
ON public.sales FOR ALL
USING (company_id = public.get_user_company_id(auth.uid()));

-- Atualizar políticas de user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Users can view company roles"
ON public.user_roles FOR SELECT
USING (company_id = public.get_user_company_id(auth.uid()) OR auth.uid() = user_id);

-- Trigger para atualizar updated_at em companies
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Atualizar função handle_new_user para suportar company_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _company_id UUID;
  _cnpj TEXT;
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
  
  RETURN NEW;
END;
$$;