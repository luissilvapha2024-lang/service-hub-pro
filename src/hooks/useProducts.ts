import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Product = Tables<'products'>;
export type ProductInsert = TablesInsert<'products'>;
export type ProductUpdate = TablesUpdate<'products'>;

export function useProducts() {
  const { user, companyId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products', companyId],
    queryFn: async () => {
      if (!user || !companyId) return [];
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('company_id', companyId)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!companyId,
  });

  const createProduct = useMutation({
    mutationFn: async (product: Omit<ProductInsert, 'user_id' | 'company_id'>) => {
      if (!user || !companyId) throw new Error('Usuário não autenticado');
      const { data, error } = await supabase
        .from('products')
        .insert({ ...product, user_id: user.id, company_id: companyId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Produto cadastrado',
        description: `${data.name} foi adicionado com sucesso.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao cadastrar produto',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, ...updates }: ProductUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Produto atualizado',
        description: `${data.name} foi atualizado com sucesso.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar produto',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Produto removido',
        description: 'O produto foi removido com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao remover produto',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    products,
    isLoading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}
