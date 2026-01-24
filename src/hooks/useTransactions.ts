import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, Enums } from '@/integrations/supabase/types';

export type Transaction = Tables<'transactions'>;
export type TransactionInsert = TablesInsert<'transactions'>;
export type TransactionType = Enums<'transaction_type'>;

export function useTransactions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading, error } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createTransaction = useMutation({
    mutationFn: async (transaction: Omit<TransactionInsert, 'user_id'>) => {
      if (!user) throw new Error('Usuário não autenticado');
      const { data, error } = await supabase
        .from('transactions')
        .insert({ ...transaction, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      const tipo = data.type === 'entrada' ? 'Entrada' : 'Saída';
      toast({
        title: 'Lançamento registrado',
        description: `${tipo} registrada com sucesso.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao registrar lançamento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const entradas = transactions
    .filter((t) => t.type === 'entrada')
    .reduce((acc, t) => acc + Number(t.amount), 0);
  
  const saidas = transactions
    .filter((t) => t.type === 'saida')
    .reduce((acc, t) => acc + Number(t.amount), 0);
  
  const saldo = entradas - saidas;

  return {
    transactions,
    isLoading,
    error,
    createTransaction,
    entradas,
    saidas,
    saldo,
  };
}
