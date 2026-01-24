import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfDay, startOfMonth, endOfDay, format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface DashboardData {
  osEmAndamento: number;
  osAguardandoAutorizacao: number;
  osConcluidasHoje: number;
  faturamentoDia: number;
  faturamentoMes: number;
  lucroEstimado: number;
  vendasPorDia: { dia: string; valor: number }[];
  servicosMaisRealizados: { nome: string; quantidade: number }[];
  statusOS: { status: string; quantidade: number; cor: string }[];
  ultimasOS: {
    id: string;
    order_number: number;
    client_name: string;
    device_model: string;
    status: string;
  }[];
}

const statusColors: Record<string, string> = {
  em_analise: '#3B82F6',
  aguardando_autorizacao: '#F59E0B',
  aguardando_pecas: '#F59E0B',
  em_andamento: '#0891B2',
  concluido: '#10B981',
  entregue: '#10B981',
  pago: '#10B981',
};

const statusLabels: Record<string, string> = {
  em_analise: 'Em Análise',
  aguardando_autorizacao: 'Aguardando',
  aguardando_pecas: 'Aguardando Peças',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  entregue: 'Entregue',
  pago: 'Pago',
};

export function useDashboard() {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', user?.id],
    queryFn: async (): Promise<DashboardData> => {
      if (!user) throw new Error('Usuário não autenticado');

      const today = new Date();
      const startOfToday = startOfDay(today).toISOString();
      const endOfToday = endOfDay(today).toISOString();
      const startOfThisMonth = startOfMonth(today).toISOString();

      // Fetch all service orders
      const { data: orders, error: ordersError } = await supabase
        .from('service_orders')
        .select(`
          *,
          client:clients(name)
        `)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch transactions for today and month
      const { data: transactionsToday, error: transTodayError } = await supabase
        .from('transactions')
        .select('*')
        .eq('type', 'entrada')
        .gte('created_at', startOfToday)
        .lte('created_at', endOfToday);

      if (transTodayError) throw transTodayError;

      const { data: transactionsMonth, error: transMonthError } = await supabase
        .from('transactions')
        .select('*')
        .eq('type', 'entrada')
        .gte('created_at', startOfThisMonth);

      if (transMonthError) throw transMonthError;

      const { data: expensesMonth, error: expensesError } = await supabase
        .from('transactions')
        .select('*')
        .eq('type', 'saida')
        .gte('created_at', startOfThisMonth);

      if (expensesError) throw expensesError;

      // Fetch order services for most performed services
      const { data: orderServices, error: orderServicesError } = await supabase
        .from('order_services')
        .select('service_name');

      if (orderServicesError) throw orderServicesError;

      // Fetch sales for last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(today, 6 - i);
        return {
          date: startOfDay(date).toISOString(),
          dayName: format(date, 'EEE', { locale: ptBR }),
        };
      });

      const { data: salesData, error: salesError } = await supabase
        .from('transactions')
        .select('created_at, amount')
        .eq('type', 'entrada')
        .gte('created_at', last7Days[0].date);

      if (salesError) throw salesError;

      // Calculate metrics
      const osEmAndamento = orders?.filter((o) => o.status === 'em_andamento').length || 0;
      const osAguardandoAutorizacao = orders?.filter((o) => o.status === 'aguardando_autorizacao').length || 0;
      const osConcluidasHoje = orders?.filter((o) => {
        if (!o.completed_at) return false;
        const completedAt = new Date(o.completed_at);
        return completedAt >= new Date(startOfToday) && completedAt <= new Date(endOfToday);
      }).length || 0;

      const faturamentoDia = transactionsToday?.reduce((acc, t) => acc + Number(t.amount), 0) || 0;
      const faturamentoMes = transactionsMonth?.reduce((acc, t) => acc + Number(t.amount), 0) || 0;
      const despesasMes = expensesMonth?.reduce((acc, t) => acc + Number(t.amount), 0) || 0;
      const lucroEstimado = faturamentoMes - despesasMes;

      // Calculate sales by day
      const vendasPorDia = last7Days.map(({ date, dayName }) => {
        const dayStart = new Date(date);
        const dayEnd = endOfDay(dayStart);
        const dayTotal = salesData
          ?.filter((s) => {
            const saleDate = new Date(s.created_at);
            return saleDate >= dayStart && saleDate <= dayEnd;
          })
          .reduce((acc, s) => acc + Number(s.amount), 0) || 0;
        
        return {
          dia: dayName.charAt(0).toUpperCase() + dayName.slice(1),
          valor: dayTotal,
        };
      });

      // Calculate status distribution
      const statusCounts: Record<string, number> = {};
      orders?.forEach((o) => {
        statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
      });

      const statusOS = Object.entries(statusCounts).map(([status, quantidade]) => ({
        status: statusLabels[status] || status,
        quantidade,
        cor: statusColors[status] || '#6B7280',
      }));

      // Calculate most performed services
      const serviceCounts: Record<string, number> = {};
      orderServices?.forEach((os) => {
        serviceCounts[os.service_name] = (serviceCounts[os.service_name] || 0) + 1;
      });

      const servicosMaisRealizados = Object.entries(serviceCounts)
        .map(([nome, quantidade]) => ({ nome, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 5);

      // Get last 5 orders
      const ultimasOS = (orders?.slice(0, 5) || []).map((o) => ({
        id: o.id,
        order_number: o.order_number,
        client_name: o.client?.name || 'Cliente não informado',
        device_model: o.device_model,
        status: o.status,
      }));

      return {
        osEmAndamento,
        osAguardandoAutorizacao,
        osConcluidasHoje,
        faturamentoDia,
        faturamentoMes,
        lucroEstimado,
        vendasPorDia,
        servicosMaisRealizados,
        statusOS,
        ultimasOS,
      };
    },
    enabled: !!user,
  });

  return {
    data: data || {
      osEmAndamento: 0,
      osAguardandoAutorizacao: 0,
      osConcluidasHoje: 0,
      faturamentoDia: 0,
      faturamentoMes: 0,
      lucroEstimado: 0,
      vendasPorDia: [],
      servicosMaisRealizados: [],
      statusOS: [],
      ultimasOS: [],
    },
    isLoading,
    error,
  };
}
