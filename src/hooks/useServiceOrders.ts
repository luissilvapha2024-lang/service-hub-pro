import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate, Enums } from '@/integrations/supabase/types';

export type ServiceOrder = Tables<'service_orders'> & {
  client?: Tables<'clients'> | null;
  order_services?: (Tables<'order_services'> & {
    service?: Tables<'services'> | null;
  })[];
};
export type ServiceOrderInsert = TablesInsert<'service_orders'>;
export type ServiceOrderUpdate = TablesUpdate<'service_orders'>;
export type OrderStatus = Enums<'order_status'>;

// Valid status values that match the database enum
export const ORDER_STATUS_VALUES: OrderStatus[] = [
  'em_analise',
  'aguardando_autorizacao', 
  'aguardando_pecas',
  'em_andamento',
  'concluido',
  'entregue',
  'pago'
];

export const statusConfig: Record<OrderStatus, { label: string; color: string; bgClass: string }> = {
  em_analise: { label: 'Em Análise', color: 'info', bgClass: 'bg-info/10 text-info' },
  aguardando_autorizacao: { label: 'Aguardando Autorização', color: 'warning', bgClass: 'bg-warning/10 text-warning' },
  aguardando_pecas: { label: 'Aguardando Peças', color: 'warning', bgClass: 'bg-warning/10 text-warning' },
  em_andamento: { label: 'Em Andamento', color: 'primary', bgClass: 'bg-primary/10 text-primary' },
  concluido: { label: 'Concluído', color: 'success', bgClass: 'bg-success/10 text-success' },
  entregue: { label: 'Entregue', color: 'success', bgClass: 'bg-success/10 text-success' },
  pago: { label: 'Pago', color: 'success', bgClass: 'bg-success/10 text-success' },
};

// Helper to validate if a string is a valid OrderStatus
export const isValidOrderStatus = (status: string): status is OrderStatus => {
  return ORDER_STATUS_VALUES.includes(status as OrderStatus);
};

export function useServiceOrders() {
  const { user, companyId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['service_orders', companyId],
    queryFn: async () => {
      if (!user || !companyId) return [];
      const { data, error } = await supabase
        .from('service_orders')
        .select(`
          *,
          client:clients(*),
          order_services(
            *,
            service:services(*)
          )
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ServiceOrder[];
    },
    enabled: !!user && !!companyId,
  });

  const createOrder = useMutation({
    mutationFn: async ({
      order,
      services,
    }: {
      order: Omit<ServiceOrderInsert, 'user_id' | 'company_id'>;
      services: { service_id: string; service_name: string; price: number; quantity: number }[];
    }) => {
      if (!user || !companyId) throw new Error('Usuário não autenticado');
      
      const { data: orderData, error: orderError } = await supabase
        .from('service_orders')
        .insert({ ...order, user_id: user.id, company_id: companyId })
        .select()
        .single();
      
      if (orderError) throw orderError;

      if (services.length > 0) {
        const orderServices = services.map((s) => ({
          order_id: orderData.id,
          service_id: s.service_id,
          service_name: s.service_name,
          price: s.price,
          quantity: s.quantity,
        }));

        const { error: servicesError } = await supabase
          .from('order_services')
          .insert(orderServices);

        if (servicesError) throw servicesError;
      }

      return orderData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['service_orders'] });
      toast({
        title: 'OS criada',
        description: `Ordem de serviço #${data.order_number} criada com sucesso.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar OS',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      // Validate status is a valid enum value
      if (!isValidOrderStatus(status)) {
        throw new Error(`Status inválido: ${status}. Use um dos valores: ${ORDER_STATUS_VALUES.join(', ')}`);
      }
      
      const { data, error } = await supabase
        .from('service_orders')
        .update({ 
          status,
          completed_at: status === 'concluido' ? new Date().toISOString() : undefined,
          delivered_at: status === 'entregue' ? new Date().toISOString() : undefined,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['service_orders'] });
      toast({
        title: 'Status atualizado',
        description: `A ordem foi atualizada para ${statusConfig[data.status].label}.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateOrder = useMutation({
    mutationFn: async ({ id, ...updates }: ServiceOrderUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('service_orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_orders'] });
      toast({
        title: 'OS atualizada',
        description: 'Ordem de serviço atualizada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar OS',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    orders,
    isLoading,
    error,
    createOrder,
    updateOrder,
    updateOrderStatus,
    statusConfig,
  };
}
