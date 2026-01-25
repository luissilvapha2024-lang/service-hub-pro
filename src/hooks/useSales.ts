import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type Sale = Tables<'sales'> & {
  client?: Tables<'clients'> | null;
  sale_items?: Tables<'sale_items'>[];
};
export type SaleInsert = TablesInsert<'sales'>;
export type SaleItemInsert = TablesInsert<'sale_items'>;

export function useSales() {
  const { user, companyId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sales = [], isLoading, error } = useQuery({
    queryKey: ['sales', companyId],
    queryFn: async () => {
      if (!user || !companyId) return [];
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          client:clients(*),
          sale_items(*)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Sale[];
    },
    enabled: !!user && !!companyId,
  });

  const createSale = useMutation({
    mutationFn: async ({
      sale,
      items,
    }: {
      sale: Omit<SaleInsert, 'user_id' | 'company_id'>;
      items: Omit<SaleItemInsert, 'sale_id'>[];
    }) => {
      if (!user || !companyId) throw new Error('Usuário não autenticado');
      
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({ ...sale, user_id: user.id, company_id: companyId })
        .select()
        .single();
      
      if (saleError) throw saleError;

      if (items.length > 0) {
        const saleItems = items.map((item) => ({
          ...item,
          sale_id: saleData.id,
        }));

        const { error: itemsError } = await supabase
          .from('sale_items')
          .insert(saleItems);

        if (itemsError) throw itemsError;

        // Update product stock for product items
        for (const item of items) {
          if (item.product_id) {
            // Get current stock and update
            const { data: product } = await supabase
              .from('products')
              .select('stock')
              .eq('id', item.product_id)
              .single();
            
            if (product) {
              await supabase
                .from('products')
                .update({ stock: product.stock - item.quantity })
                .eq('id', item.product_id);
            }
          }
        }
      }

      // Create a transaction for this sale
      await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          company_id: companyId,
          type: 'entrada',
          category: 'Venda',
          description: `Venda #${saleData.sale_number}`,
          amount: saleData.total,
          payment_method: saleData.payment_method,
          reference_id: saleData.id,
          reference_type: 'sale',
        });

      return saleData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: 'Venda finalizada!',
        description: `Venda #${data.sale_number} registrada com sucesso.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao finalizar venda',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    sales,
    isLoading,
    error,
    createSale,
  };
}
