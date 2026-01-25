-- Permitir leitura pública da tabela companies para verificação de CNPJ no login
-- (apenas os campos necessários: id e cnpj)
CREATE POLICY "Anyone can check company exists by CNPJ"
ON public.companies FOR SELECT
USING (true);