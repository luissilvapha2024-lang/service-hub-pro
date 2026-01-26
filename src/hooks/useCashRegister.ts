import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface CashRegisterSession {
  id: string;
  company_id: string | null;
  user_id: string;
  opened_at: string;
  closed_at: string | null;
  opening_balance: number;
  closing_balance: number | null;
  expected_balance: number | null;
  difference: number | null;
  status: 'open' | 'closed';
  notes: string | null;
  created_at: string;
}

export interface CashMovement {
  id: string;
  session_id: string;
  company_id: string | null;
  user_id: string;
  type: 'sangria' | 'suplemento';
  amount: number;
  reason: string;
  created_at: string;
}

export function useCashRegister() {
  const { user, companyId } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch current open session
  const { data: currentSession, isLoading: isLoadingSession } = useQuery({
    queryKey: ['cash-session', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      
      const { data, error } = await supabase
        .from('cash_register_sessions')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'open')
        .order('opened_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as CashRegisterSession | null;
    },
    enabled: !!companyId,
  });

  // Fetch movements for current session
  const { data: movements = [], isLoading: isLoadingMovements } = useQuery({
    queryKey: ['cash-movements', currentSession?.id],
    queryFn: async () => {
      if (!currentSession?.id) return [];
      
      const { data, error } = await supabase
        .from('cash_movements')
        .select('*')
        .eq('session_id', currentSession.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CashMovement[];
    },
    enabled: !!currentSession?.id,
  });

  // Check if there's an open session from a previous day
  const isPreviousDaySessionOpen = currentSession
    ? new Date(currentSession.opened_at).toDateString() !== new Date().toDateString()
    : false;

  // Calculate expected balance
  const calculateExpectedBalance = (session: CashRegisterSession, sessionMovements: CashMovement[], salesTotal: number) => {
    const sangrias = sessionMovements
      .filter(m => m.type === 'sangria')
      .reduce((acc, m) => acc + Number(m.amount), 0);
    
    const suplementos = sessionMovements
      .filter(m => m.type === 'suplemento')
      .reduce((acc, m) => acc + Number(m.amount), 0);

    return Number(session.opening_balance) + salesTotal + suplementos - sangrias;
  };

  // Open cash register
  const openCashRegister = useMutation({
    mutationFn: async ({ openingBalance, notes }: { openingBalance: number; notes?: string }) => {
      if (!user?.id || !companyId) throw new Error('Usuário não autenticado');

      // Check if there's already an open session
      if (currentSession) {
        throw new Error('Já existe um caixa aberto. Feche-o antes de abrir outro.');
      }

      const { data, error } = await supabase
        .from('cash_register_sessions')
        .insert({
          company_id: companyId,
          user_id: user.id,
          opening_balance: openingBalance,
          notes,
          status: 'open',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-session'] });
      toast({
        title: 'Caixa aberto',
        description: 'O caixa foi aberto com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao abrir caixa',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Close cash register
  const closeCashRegister = useMutation({
    mutationFn: async ({ 
      closingBalance, 
      notes,
      salesTotal 
    }: { 
      closingBalance: number; 
      notes?: string;
      salesTotal: number;
    }) => {
      if (!user?.id || !currentSession) throw new Error('Nenhum caixa aberto');

      const expectedBalance = calculateExpectedBalance(currentSession, movements, salesTotal);
      const difference = closingBalance - expectedBalance;

      const { data, error } = await supabase
        .from('cash_register_sessions')
        .update({
          closed_at: new Date().toISOString(),
          closing_balance: closingBalance,
          expected_balance: expectedBalance,
          difference,
          status: 'closed',
          notes: notes || currentSession.notes,
        })
        .eq('id', currentSession.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-session'] });
      queryClient.invalidateQueries({ queryKey: ['cash-movements'] });
      toast({
        title: 'Caixa fechado',
        description: 'O caixa foi fechado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao fechar caixa',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Add cash movement (sangria or suplemento)
  const addCashMovement = useMutation({
    mutationFn: async ({ 
      type, 
      amount, 
      reason 
    }: { 
      type: 'sangria' | 'suplemento'; 
      amount: number; 
      reason: string 
    }) => {
      if (!user?.id || !companyId || !currentSession) {
        throw new Error('Caixa não está aberto');
      }

      const { data, error } = await supabase
        .from('cash_movements')
        .insert({
          session_id: currentSession.id,
          company_id: companyId,
          user_id: user.id,
          type,
          amount,
          reason,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cash-movements'] });
      toast({
        title: variables.type === 'sangria' ? 'Sangria registrada' : 'Suplemento registrado',
        description: `Movimentação de R$ ${variables.amount.toFixed(2)} registrada.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao registrar movimentação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    currentSession,
    movements,
    isLoading: isLoadingSession || isLoadingMovements,
    isPreviousDaySessionOpen,
    isCashOpen: !!currentSession && !isPreviousDaySessionOpen,
    openCashRegister,
    closeCashRegister,
    addCashMovement,
    calculateExpectedBalance,
  };
}
