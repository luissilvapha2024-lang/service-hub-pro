import { useMemo } from 'react';
import { useServiceOrders } from '@/hooks/useServiceOrders';
import { useSales } from '@/hooks/useSales';
import { useClients } from '@/hooks/useClients';
import { useProducts } from '@/hooks/useProducts';
import { useTransactions } from '@/hooks/useTransactions';
import { isWithinInterval, format, parseISO, subMonths } from 'date-fns';
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
  const { products, isLoading: productsLoading } = useProducts();
  const { transactions, isLoading: transactionsLoading } = useTransactions();

  const isLoading = ordersLoading || salesLoading || clientsLoading || productsLoading || transactionsLoading;

  // Build product cost map
  const productCostMap = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach(p => { map[p.id] = p.cost || 0; });
    return map;
  }, [products]);

  // Filter orders by date range and filters
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (startDate && endDate) {
        const orderDate = parseISO(order.created_at);
        if (!isWithinInterval(orderDate, { start: startDate, end: endDate })) return false;
      }
      if (selectedClientId !== 'all' && order.client_id !== selectedClientId) return false;
      if (selectedServiceId !== 'all') {
        const hasService = order.order_services?.some(os => os.service_id === selectedServiceId);
        if (!hasService) return false;
      }
      return true;
    });
  }, [orders, startDate, endDate, selectedClientId, selectedServiceId]);

  // Filter sales by date range and filters
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      if (startDate && endDate) {
        const saleDate = parseISO(sale.created_at);
        if (!isWithinInterval(saleDate, { start: startDate, end: endDate })) return false;
      }
      if (selectedClientId !== 'all' && sale.client_id !== selectedClientId) return false;
      if (selectedServiceId !== 'all') {
        const hasService = sale.sale_items?.some(item => item.service_id === selectedServiceId);
        if (!hasService) return false;
      }
      return true;
    });
  }, [sales, startDate, endDate, selectedClientId, selectedServiceId]);

  // Filter transactions by date range
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (startDate && endDate) {
        const tDate = parseISO(t.created_at);
        if (!isWithinInterval(tDate, { start: startDate, end: endDate })) return false;
      }
      return true;
    });
  }, [transactions, startDate, endDate]);

  // Calculate product profit from sales
  const productProfitData = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;
    const perProduct: Record<string, { name: string; revenue: number; cost: number; profit: number; quantity: number }> = {};

    filteredSales.forEach(sale => {
      sale.sale_items?.forEach(item => {
        if (item.item_type === 'product' && item.product_id) {
          const cost = productCostMap[item.product_id] || 0;
          const itemCost = cost * item.quantity;
          const itemRevenue = item.total_price;
          
          totalRevenue += itemRevenue;
          totalCost += itemCost;

          if (!perProduct[item.item_name]) {
            perProduct[item.item_name] = { name: item.item_name, revenue: 0, cost: 0, profit: 0, quantity: 0 };
          }
          perProduct[item.item_name].revenue += itemRevenue;
          perProduct[item.item_name].cost += itemCost;
          perProduct[item.item_name].profit += (itemRevenue - itemCost);
          perProduct[item.item_name].quantity += item.quantity;
        }
      });
    });

    const productList = Object.values(perProduct).sort((a, b) => b.profit - a.profit);

    return {
      totalRevenue,
      totalCost,
      totalProfit: totalRevenue - totalCost,
      margin: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0,
      products: productList,
    };
  }, [filteredSales, productCostMap]);

  // Calculate service profit from sales (services have no cost tracked, so revenue = profit)
  const serviceProfitData = useMemo(() => {
    let totalRevenue = 0;
    const perService: Record<string, { name: string; revenue: number; quantity: number }> = {};

    // From sale_items (services sold via PDV)
    filteredSales.forEach(sale => {
      sale.sale_items?.forEach(item => {
        if (item.item_type === 'service') {
          totalRevenue += item.total_price;
          if (!perService[item.item_name]) {
            perService[item.item_name] = { name: item.item_name, revenue: 0, quantity: 0 };
          }
          perService[item.item_name].revenue += item.total_price;
          perService[item.item_name].quantity += item.quantity;
        }
      });
    });

    return { totalRevenue, services: Object.values(perService).sort((a, b) => b.revenue - a.revenue) };
  }, [filteredSales]);

  // Calculate OS revenue
  const osProfitData = useMemo(() => {
    let totalRevenue = 0;
    let completedRevenue = 0;
    let pendingRevenue = 0;

    filteredOrders.forEach(order => {
      const value = order.final_value || order.estimated_value || 0;
      totalRevenue += value;
      if (['concluido', 'entregue', 'pago'].includes(order.status)) {
        completedRevenue += value;
      } else {
        pendingRevenue += value;
      }
    });

    return { totalRevenue, completedRevenue, pendingRevenue };
  }, [filteredOrders]);

  // Expenses from transactions
  const expensesData = useMemo(() => {
    const entradas = filteredTransactions.filter(t => t.type === 'entrada').reduce((s, t) => s + Number(t.amount), 0);
    const saidas = filteredTransactions.filter(t => t.type === 'saida').reduce((s, t) => s + Number(t.amount), 0);
    return { entradas, saidas, lucroLiquido: entradas - saidas };
  }, [filteredTransactions]);

  // Monthly data for charts (last 6 months)
  const monthlyData = useMemo(() => {
    const months: { mes: string; vendasReceita: number; vendasLucro: number; osReceita: number; despesas: number; monthKey: string }[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthKey = format(date, 'yyyy-MM');
      const monthLabel = format(date, 'MMM', { locale: ptBR });
      
      // Sales revenue & profit for this month
      let vendasReceita = 0;
      let vendasLucro = 0;
      sales.filter(sale => format(parseISO(sale.created_at), 'yyyy-MM') === monthKey).forEach(sale => {
        vendasReceita += (sale.total || 0);
        sale.sale_items?.forEach(item => {
          if (item.item_type === 'product' && item.product_id) {
            const cost = productCostMap[item.product_id] || 0;
            vendasLucro += item.total_price - (cost * item.quantity);
          } else {
            vendasLucro += item.total_price;
          }
        });
      });

      // OS revenue for this month
      const osReceita = orders
        .filter(order => format(parseISO(order.created_at), 'yyyy-MM') === monthKey)
        .reduce((sum, order) => sum + (order.final_value || order.estimated_value || 0), 0);

      // Expenses for this month
      const despesas = transactions
        .filter(t => t.type === 'saida' && format(parseISO(t.created_at), 'yyyy-MM') === monthKey)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      months.push({
        mes: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        vendasReceita,
        vendasLucro,
        osReceita,
        despesas,
        monthKey,
      });
    }

    return months;
  }, [sales, orders, transactions, productCostMap]);

  // OS status distribution
  const osStatusData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    filteredOrders.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });

    const statusMapping: Record<string, { name: string; color: string }> = {
      em_analise: { name: 'Em Análise', color: '#6366F1' },
      aguardando_autorizacao: { name: 'Aguardando', color: '#F59E0B' },
      aguardando_pecas: { name: 'Aguardando Peças', color: '#E879A0' },
      em_andamento: { name: 'Em Andamento', color: '#0EA5E9' },
      concluido: { name: 'Concluídas', color: '#10B981' },
      entregue: { name: 'Entregue', color: '#8B5CF6' },
      pago: { name: 'Pago', color: '#14B8A6' },
    };

    return Object.entries(statusCounts)
      .map(([status, count]) => ({
        name: statusMapping[status]?.name || status,
        value: count,
        color: statusMapping[status]?.color || 'hsl(var(--muted))',
      }))
      .filter(item => item.value > 0);
  }, [filteredOrders]);

  // Top clients
  const topClients = useMemo(() => {
    const clientData: Record<string, { name: string; phone: string; osCount: number; totalValue: number; lastVisit: string }> = {};

    filteredOrders.forEach(order => {
      if (order.client) {
        const clientId = order.client.id;
        if (!clientData[clientId]) {
          clientData[clientId] = { name: order.client.name, phone: order.client.phone, osCount: 0, totalValue: 0, lastVisit: order.created_at };
        }
        clientData[clientId].osCount += 1;
        clientData[clientId].totalValue += (order.final_value || order.estimated_value || 0);
        if (order.created_at > clientData[clientId].lastVisit) {
          clientData[clientId].lastVisit = order.created_at;
        }
      }
    });

    return Object.values(clientData).sort((a, b) => b.totalValue - a.totalValue).slice(0, 5);
  }, [filteredOrders]);

  // Payment method distribution
  const paymentMethodData = useMemo(() => {
    const methods: Record<string, number> = {};
    filteredSales.forEach(sale => {
      const method = sale.payment_method || 'Outros';
      methods[method] = (methods[method] || 0) + (sale.total || 0);
    });
    
    const labels: Record<string, string> = {
      dinheiro: 'Dinheiro', pix: 'PIX', credito: 'Crédito', debito: 'Débito',
      transferencia: 'Transferência', boleto: 'Boleto', Outros: 'Outros',
    };
    const colors = ['#0EA5E9', '#10B981', '#8B5CF6', '#F59E0B', '#E879A0', '#6366F1', '#94A3B8'];

    return Object.entries(methods).map(([method, value], i) => ({
      name: labels[method] || method,
      value,
      color: colors[i % colors.length],
    }));
  }, [filteredSales]);

  // Summary metrics
  const summaryMetrics = useMemo(() => {
    const totalSalesRevenue = filteredSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const totalOSRevenue = filteredOrders.reduce((sum, order) => sum + (order.final_value || order.estimated_value || 0), 0);
    const completedOrders = filteredOrders.filter(o => ['concluido', 'entregue', 'pago'].includes(o.status)).length;

    return {
      totalRevenue: totalSalesRevenue + totalOSRevenue,
      totalSalesRevenue,
      totalOSRevenue,
      salesCount: filteredSales.length,
      ordersCount: filteredOrders.length,
      completedOrders,
      productProfit: productProfitData.totalProfit,
      productMargin: productProfitData.margin,
      netProfit: expensesData.lucroLiquido,
      expenses: expensesData.saidas,
    };
  }, [filteredSales, filteredOrders, productProfitData, expensesData]);

  return {
    isLoading,
    monthlyData,
    osStatusData,
    topClients,
    summaryMetrics,
    productProfitData,
    serviceProfitData,
    osProfitData,
    expensesData,
    paymentMethodData,
    filteredOrders,
    filteredSales,
  };
}
