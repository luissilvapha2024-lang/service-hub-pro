-- Fix the notify_os_status_change function to properly cast enum to text
CREATE OR REPLACE FUNCTION public.notify_os_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _client_name TEXT;
  _status_label TEXT;
BEGIN
  -- Only trigger on status change
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Get client name
    SELECT name INTO _client_name FROM public.clients WHERE id = NEW.client_id;
    
    -- Map status to Portuguese label (explicitly cast enum to text to avoid type conflicts)
    _status_label := CASE NEW.status::text
      WHEN 'em_analise' THEN 'Em Análise'
      WHEN 'aguardando_autorizacao' THEN 'Aguardando Autorização'
      WHEN 'aguardando_pecas' THEN 'Aguardando Peças'
      WHEN 'em_andamento' THEN 'Em Andamento'
      WHEN 'concluido' THEN 'Concluído'
      WHEN 'entregue' THEN 'Entregue'
      WHEN 'pago' THEN 'Pago'
      ELSE NEW.status::text
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
$function$;