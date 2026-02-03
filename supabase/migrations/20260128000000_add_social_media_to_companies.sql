-- Adicionar colunas de redes sociais à tabela de empresas
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS instagram TEXT,
ADD COLUMN IF NOT EXISTS facebook TEXT,
ADD COLUMN IF NOT EXISTS website TEXT;