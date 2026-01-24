-- =============================================
-- 1. ENUM para roles de usuário
-- =============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'tecnico', 'caixa');

-- =============================================
-- 2. Tabela de perfis de usuário
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  company_name TEXT,
  company_cnpj TEXT,
  company_phone TEXT,
  company_address TEXT,
  company_logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 3. Tabela de roles de usuário (segurança)
-- =============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função security definer para verificar roles (evita recursão)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Função para obter role do usuário
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- 4. Tabela de clientes
-- =============================================
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  cpf TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own clients" ON public.clients
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- 5. Tabela de serviços
-- =============================================
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  estimated_time INTEGER DEFAULT 60, -- em minutos
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own services" ON public.services
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- 6. Tabela de produtos
-- =============================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own products" ON public.products
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- 7. Tabela de ordens de serviço
-- =============================================
CREATE TYPE public.order_status AS ENUM (
  'em_analise',
  'aguardando_autorizacao', 
  'aguardando_pecas',
  'em_andamento',
  'concluido',
  'entregue',
  'pago'
);

CREATE TABLE public.service_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  order_number SERIAL,
  device_model TEXT NOT NULL,
  device_imei TEXT,
  reported_issue TEXT NOT NULL,
  diagnosis TEXT,
  observations TEXT,
  internal_notes TEXT,
  status order_status NOT NULL DEFAULT 'em_analise',
  estimated_value DECIMAL(10,2) DEFAULT 0,
  final_value DECIMAL(10,2) DEFAULT 0,
  warranty_days INTEGER DEFAULT 90,
  technician_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own orders" ON public.service_orders
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- 8. Serviços da ordem de serviço
-- =============================================
CREATE TABLE public.order_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.service_orders(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.order_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage order services" ON public.order_services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.service_orders 
      WHERE id = order_id AND user_id = auth.uid()
    )
  );

-- =============================================
-- 9. Histórico de alterações da OS
-- =============================================
CREATE TABLE public.order_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.service_orders(id) ON DELETE CASCADE NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  old_status order_status,
  new_status order_status,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.order_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view order history" ON public.order_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.service_orders 
      WHERE id = order_id AND user_id = auth.uid()
    )
  );

-- =============================================
-- 10. Tabela de transações financeiras
-- =============================================
CREATE TYPE public.transaction_type AS ENUM ('entrada', 'saida');

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type transaction_type NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT,
  reference_id UUID, -- pode referenciar uma OS ou venda
  reference_type TEXT, -- 'order' ou 'sale'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own transactions" ON public.transactions
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- 11. Tabela de vendas (PDV)
-- =============================================
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  sale_number SERIAL,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL,
  installments INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sales" ON public.sales
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- 12. Itens da venda
-- =============================================
CREATE TABLE public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  item_type TEXT NOT NULL, -- 'product' ou 'service'
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage sale items" ON public.sale_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.sales 
      WHERE id = sale_id AND user_id = auth.uid()
    )
  );

-- =============================================
-- 13. Triggers para updated_at
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_orders_updated_at
  BEFORE UPDATE ON public.service_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 14. Trigger para criar perfil automaticamente no signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  
  -- Atribuir role padrão (admin para o primeiro usuário da empresa)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();