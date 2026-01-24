-- Criar bucket para fotos das ordens de serviço
INSERT INTO storage.buckets (id, name, public)
VALUES ('order-photos', 'order-photos', true);

-- Criar tabela para armazenar referências das fotos
CREATE TABLE public.order_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.order_photos ENABLE ROW LEVEL SECURITY;

-- Política para gerenciar fotos das OS do usuário
CREATE POLICY "Users can manage order photos"
ON public.order_photos
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM service_orders
    WHERE service_orders.id = order_photos.order_id
    AND service_orders.user_id = auth.uid()
  )
);

-- Políticas de storage para o bucket
CREATE POLICY "Users can upload order photos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'order-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view order photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'order-photos');

CREATE POLICY "Users can delete own order photos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'order-photos' AND auth.role() = 'authenticated');