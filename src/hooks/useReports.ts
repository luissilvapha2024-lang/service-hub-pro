import { useMemo } from 'react';
import { useServiceOrders, statusConfig } from '@/hooks/useServiceOrders';
import { useSales } from '@/hooks/useSales';
import { useClients } from '@/hooks/useClients';
import { isWithinInterval, format, parseISO, startOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UseReportsParams {
  startDate?: Date;
  endDate?: Date;
  selectedClientId?: string;
  selectedServiceId?: string;
}

export function useReports({
  startDate,
  endDate,
  selectedClientId = 'all',
  selectedServiceId = 'all',
}: UseReportsParams) {
  const { orders, isLoading: ordersLoading } = useServiceOrders();
  const { sales, isLoading: salesLoading } = useSales();
  const { clients, isLoading: clientsLoading } = useClients();

  const isLoading = ordersLoading || salesLoading || clientsLoading;

  // Filter orders by date range and filters
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Date filter
      if (startDate && endDate) {
        const orderDate = parseISO(order.created_at);
        if (!isWithinInterval(orderDate, { start: startDate, end: endDate })) {
          return false;
        }
      }

      // Client filter
      if (selectedClientId !== 'all' && order.client_id !== selectedClientId) {
        return false;
      }

      // Service filter
      if (selectedServiceId !== 'all') {
        const hasService = order.order_services?.some(
          os => os.service_id === selectedServiceId
        );
        if (!hasService) return false;
      }

      return true;
    });
  }, [orders, startDate, endDate, selectedClientId, selectedServiceId]);

  // Filter sales by date range and filters
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      // Date filter
      if (startDate && endDate) {
        const saleDate = parseISO(sale.created_at);
        if (!isWithinInterval(saleDate, { start: startDate, end: endDate })) {
          return false;
        }
      }

      // Client filter
      if (selectedClientId !== 'all' && sale.client_id !== selectedClientId) {
        return false;
      }

      // Service filter - check if any sale item matches the service
      if (selectedServiceId !== 'all') {
        const hasService = sale.sale_items?.some(
          item => item.service_id === selectedServiceId
        );
        if (!hasService) return false;
      }

      return true;
    });
  }, [sales, startDate, endDate, selectedClientId, selectedServiceId]);

  // Calculate monthly data for charts (last 6 months)
  const monthlyData = useMemo(() => {
    const months: { mes: string; vendas: number; servicos: number; monthKey: string }[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthKey = format(date, 'yyyy-MM');
      const monthLabel = format(date, 'MMM', { locale: ptBR });
      
      // Sum sales for this month
      const monthlySalesTotal = sales
        .filter(sale => {
          const saleDate = parseISO(sale.created_at);
          return format(saleDate, 'yyyy-MM') === monthKey;
        })
        .reduce((sum, sale) => sum + (sale.total || 0), 0);

      // Sum service orders value for this month
      const monthlyServicesTotal = orders
        .filter(order => {
          const orderDate = parseISO(order.created_at);
          return format(orderDate, 'yyyy-MM') === monthKey;
        })
        .reduce((sum, order) => sum + (order.final_value || order.estimated_value || 0), 0);

      months.push({
        mes: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        vendas: monthlySalesTotal,
        servicos: monthlyServicesTotal,
        monthKey,
      });
    }

    return months;
  }, [sales, orders]);

  // Calculate OS status distribution
  const osStatusData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    
    filteredOrders.forEach(order => {
      const status = order.status;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const statusMapping: Record<string, { name: string; color: string }> = {
      em_analise: { name: 'Em Análise', color: 'hsl(var(--info))' },
      aguardando_autorizacao: { name: 'Aguardando', color: 'hsl(var(--warning))' },
      aguardando_pecas: { name: 'Aguardando Peças', color: 'hsl(var(--warning))' },
      em_andamento: { name: 'Em Andamento', color: 'hsl(var(--primary))' },
      concluido: { name: 'Concluídas', color: 'hsl(var(--success))' },
      entregue: { name: 'Entregue', color: 'hsl(var(--success))' },
      pago: { name: 'Pago', color: 'hsl(var(--success))' },
    };

    return Object.entries(statusCounts)
      .map(([status, count]) => ({
        name: statusMapping[status]?.name || status,
        value: count,
        color: statusMapping[status]?.color || 'hsl(var(--muted))',
      }))
      .filter(item => item.value > 0);
  }, [filteredOrders]);

  // Calculate most sold services
  const topServices = useMemo(() => {
    const serviceCounts: Record<string, number> = {};

    // Count from order_services
    filteredOrders.forEach(order => {
      order.order_services?.forEach(os => {
        const name = os.service_name || os.service?.name || 'Serviço';
        serviceCounts[name] = (serviceCounts[name] || 0) + os.quantity;
      });
    });

    // Count from sale_items (services only)
    filteredSales.forEach(sale => {
      sale.sale_items?.forEach(item => {
        if (item.item_type === 'service') {
          serviceCounts[item.item_name] = (serviceCounts[item.item_name] || 0) + item.quantity;
        }
      });
    });

    return Object.entries(serviceCounts)
      .map(([nome, quantidade]) => ({ nome, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);
  }, [filteredOrders, filteredSales]);

  // Calculate most sold products
  const topProducts = useMemo(() => {
    const productCounts: Record<string, { quantidade: number; receita: number }> = {};

    // Count from sale_items (products only)
    filteredSales.forEach(sale => {
      sale.sale_items?.forEach(item => {
        if (item.item_type === 'product') {
          if (!productCounts[item.item_name]) {
            productCounts[item.item_name] = { quantidade: 0, receita: 0 };
          }
          productCounts[item.item_name].quantidade += item.quantity;
          productCounts[item.item_name].receita += item.total_price;
        }
      });
    });

    return Object.entries(productCounts)
      .map(([nome, data]) => ({ nome, quantidade: data.quantidade, receita: data.receita }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);
  }, [filteredSales]);

  // Calculate top clients
  const topClients = useMemo(() => {
    const clientData: Record<string, { 
      name: string; 
      phone: string; 
      osCount: number; 
      lastVisit: string;
    }> = {};

    filteredOrders.forEach(order => {
      if (order.client) {
        const clientId = order.client.id;
        if (!clientData[clientId]) {
          clientData[clientId] = {
            name: order.client.name,
            phone: order.client.phone,
            osCount: 0,
            lastVisit: order.created_at,
          };
        }
        clientData[clientId].osCount += 1;
        if (order.created_at > clientData[clientId].lastVisit) {
          clientData[clientId].lastVisit = order.created_at;
        }
      }
    });

    return Object.values(clientData)
      .sort((a, b) => b.osCount - a.osCount)
      .slice(0, 5);
  }, [filteredOrders]);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const totalSales = filteredSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const totalOrders = filteredOrders.reduce(
      (sum, order) => sum + (order.final_value || order.estimated_value || 0), 
      0
    );
    const completedOrders = filteredOrders.filter(
      o => ['concluido', 'entregue', 'pago'].includes(o.status)
    ).length;

    return {
      totalRevenue: totalSales + totalOrders,
      salesCount: filteredSales.length,
      ordersCount: filteredOrders.length,
      completedOrders,
    };
  }, [filteredSales, filteredOrders]);

  return {
    isLoading,
    monthlyData,
    osStatusData,
    topServices,
    topProducts,
    topClients,
    summaryMetrics,
    filteredOrders,
    filteredSales,
  };
}
