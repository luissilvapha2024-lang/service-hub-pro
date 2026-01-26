-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id),
  user_id UUID,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT false,
  reference_type TEXT,
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their company notifications
CREATE POLICY "Users can view company notifications"
ON public.notifications
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- Create policy for users to update their company notifications (mark as read)
CREATE POLICY "Users can update company notifications"
ON public.notifications
FOR UPDATE
USING (company_id = get_user_company_id(auth.uid()));

-- Create policy for system to insert notifications
CREATE POLICY "Users can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_notifications_company_id ON public.notifications(company_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to create notification when OS status changes
CREATE OR REPLACE FUNCTION public.notify_os_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _client_name TEXT;
  _status_label TEXT;
BEGIN
  -- Only trigger on status change
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Get client name
    SELECT name INTO _client_name FROM public.clients WHERE id = NEW.client_id;
    
    -- Map status to Portuguese label
    _status_label := CASE NEW.status
      WHEN 'em_analise' THEN 'Em Análise'
      WHEN 'aguardando_autorizacao' THEN 'Aguardando Autorização'
      WHEN 'aguardando_pecas' THEN 'Aguardando Peças'
      WHEN 'em_andamento' THEN 'Em Andamento'
      WHEN 'concluido' THEN 'Concluído'
      WHEN 'entregue' THEN 'Entregue'
      WHEN 'pago' THEN 'Pago'
      ELSE NEW.status
    END;
    
    -- Insert notification
    INSERT INTO public.notifications (
      company_id,
      title,
      message,
      type,
      reference_type,
      reference_id
    ) VALUES (
      NEW.company_id,
      'Status da OS Atualizado',
      'OS-' || LPAD(NEW.order_number::text, 3, '0') || ' (' || COALESCE(_client_name, 'Cliente') || ') → ' || _status_label,
      CASE 
        WHEN NEW.status = 'concluido' THEN 'success'
        WHEN NEW.status = 'pago' THEN 'success'
        WHEN NEW.status = 'entregue' THEN 'info'
        ELSE 'info'
      END,
      'service_order',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for OS status changes
CREATE TRIGGER on_service_order_status_change
  AFTER UPDATE ON public.service_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_os_status_change();