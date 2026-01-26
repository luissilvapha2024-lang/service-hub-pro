-- Tabela para sessões de caixa (abertura/fechamento)
CREATE TABLE public.cash_register_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id),
  user_id UUID NOT NULL,
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE,
  opening_balance NUMERIC NOT NULL DEFAULT 0,
  closing_balance NUMERIC,
  expected_balance NUMERIC,
  difference NUMERIC,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para movimentações de caixa (sangria, suplemento)
CREATE TABLE public.cash_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.cash_register_sessions(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id),
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('sangria', 'suplemento')),
  amount NUMERIC NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cash_register_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;

-- RLS policies for cash_register_sessions
CREATE POLICY "Users can manage company cash sessions"
ON public.cash_register_sessions
FOR ALL
USING (company_id = get_user_company_id(auth.uid()));

-- RLS policies for cash_movements
CREATE POLICY "Users can manage company cash movements"
ON public.cash_movements
FOR ALL
USING (company_id = get_user_company_id(auth.uid()));

-- Index for faster queries
CREATE INDEX idx_cash_sessions_company_status ON public.cash_register_sessions(company_id, status);
CREATE INDEX idx_cash_sessions_opened_at ON public.cash_register_sessions(opened_at DESC);
CREATE INDEX idx_cash_movements_session ON public.cash_movements(session_id);