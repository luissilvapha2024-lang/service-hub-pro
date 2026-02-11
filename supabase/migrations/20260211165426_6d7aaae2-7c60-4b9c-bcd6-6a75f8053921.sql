
-- Trigger to prevent status regression on locked statuses (concluido, entregue, pago)
CREATE OR REPLACE FUNCTION public.validate_order_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_index INT;
  new_index INT;
  status_order TEXT[] := ARRAY['em_analise', 'aguardando_autorizacao', 'aguardando_pecas', 'em_andamento', 'concluido', 'entregue', 'pago'];
  locked_statuses TEXT[] := ARRAY['concluido', 'entregue', 'pago'];
BEGIN
  -- Only check if status is changing
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    old_index := array_position(status_order, OLD.status::text);
    new_index := array_position(status_order, NEW.status::text);

    -- If current status is locked, cannot go backwards
    IF OLD.status::text = ANY(locked_statuses) AND new_index < old_index THEN
      RAISE EXCEPTION 'Não é permitido retroceder o status de uma OS que está como %. Status permitidos: apenas avanço.', OLD.status::text;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_status_transition
BEFORE UPDATE ON public.service_orders
FOR EACH ROW
EXECUTE FUNCTION public.validate_order_status_transition();
