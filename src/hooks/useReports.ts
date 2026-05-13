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

  // Payment method distribution (split combined methods into individual ones)
  const paymentMethodData = useMemo(() => {
    const labels: Record<string, string> = {
      dinheiro: 'Dinheiro', pix: 'PIX', credito: 'Crédito', debito: 'Débito',
      transferencia: 'Transferência', boleto: 'Boleto', outros: 'Outros',
    };
    const colorMap: Record<string, string> = {
      Dinheiro: '#F59E0B',
      PIX: '#0EA5E9',
      Crédito: '#8B5CF6',
      Débito: '#E879A0',
      Transferência: '#10B981',
      Boleto: '#6366F1',
      Outros: '#94A3B8',
    };

    // Aliases → canonical label (handles common variations)
    const aliasMap: Record<string, string> = {
      dinheiro: 'Dinheiro', cash: 'Dinheiro', especie: 'Dinheiro', 'espécie': 'Dinheiro',
      pix: 'PIX',
      credito: 'Crédito', 'crédito': 'Crédito',
      'cartao de credito': 'Crédito', 'cartão de crédito': 'Crédito',
      'cartao credito': 'Crédito', 'cartão credito': 'Crédito',
      debito: 'Débito', 'débito': 'Débito',
      'cartao de debito': 'Débito', 'cartão de débito': 'Débito',
      'cartao debito': 'Débito', 'cartão debito': 'Débito',
      cartao: 'Cartão', 'cartão': 'Cartão',
      transferencia: 'Transferência', 'transferência': 'Transferência',
      ted: 'Transferência', doc: 'Transferência',
      boleto: 'Boleto',
      cheque: 'Cheque',
      crediario: 'Crediário', 'crediário': 'Crediário', fiado: 'Crediário',
      outros: 'Outros', outro: 'Outros',
    };

    const normalize = (raw: string): string => {
      const key = raw.trim().toLowerCase().replace(/\s+/g, ' ');
      if (aliasMap[key]) return aliasMap[key];
      if (labels[key]) return labels[key];
      const found = Object.values(labels).find(l => l.toLowerCase() === key);
      if (found) return found;
      return raw.trim().replace(/\b\w/g, c => c.toUpperCase());
    };

    // Parse a BR currency number like "1.234,56", "1234,56", "1234.56", "1234"
    const parseBRL = (s: string): number => {
      const cleaned = s.replace(/\s/g, '');
      if (cleaned.includes(',')) {
        return parseFloat(cleaned.replace(/\./g, '').replace(',', '.')) || 0;
      }
      // No comma: dot may be decimal OR thousands. Treat dot as decimal only if 1-2 digits after.
      const dotMatch = cleaned.match(/^(\d+)\.(\d{1,2})$/);
      if (dotMatch) return parseFloat(cleaned) || 0;
      return parseFloat(cleaned.replace(/\./g, '')) || 0;
    };

    // Parse strings with various formats:
    //  "Dinheiro (R$ 150,00) + Débito (R$ 233,00)"
    //  "Dinheiro: R$ 150,00 + Débito R$ 233,00"
    //  "Dinheiro R$150 / Cartão de Crédito R$ 233,00"
    //  "Dinheiro 150,00 e Débito 233,00"
    //  "pix" / "Dinheiro"
    const parsePaymentMethod = (raw: string, totalFallback: number): Array<{ name: string; value: number }> => {
      if (!raw) return [{ name: 'Outros', value: totalFallback }];
      const trimmed = raw.trim();

      // Match "<name> [sep] [(] [R$] <amount> [)]"
      // Name: letters/spaces (multi-word like "Cartão de Crédito"); Amount: BR or US number
      const pairRegex = /([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s]*?)\s*[:\-]?\s*\(?\s*(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{1,2}|\d+,\d{1,2}|\d+\.\d{1,2}|\d+)\s*\)?/gi;
      const parts: Array<{ name: string; value: number }> = [];
      let match: RegExpExecArray | null;

      while ((match = pairRegex.exec(trimmed)) !== null) {
        const rawName = match[1].trim();
        if (!rawName) continue;
        const value = parseBRL(match[2]);
        if (value <= 0) continue;
        parts.push({ name: normalize(rawName), value });
      }

      // Merge duplicate names (same form of payment appearing more than once)
      if (parts.length > 0) {
        const merged: Record<string, number> = {};
        parts.forEach(p => { merged[p.name] = (merged[p.name] || 0) + p.value; });
        const result = Object.entries(merged).map(([name, value]) => ({ name, value }));

        // Sanity check: if extracted sum is way off from total and we only got 1 part,
        // fall back to using totalFallback for that single method
        if (result.length === 1 && totalFallback > 0) {
          const diff = Math.abs(result[0].value - totalFallback);
          if (diff / totalFallback > 0.5) {
            return [{ name: result[0].name, value: totalFallback }];
          }
        }
        return result;
      }

      // No amounts found — split by separators and distribute equally
      const tokens = trimmed.split(/\s*(?:\+|,|\/|&|\se\s)\s*/i).filter(Boolean);
      if (tokens.length > 1) {
        const each = totalFallback / tokens.length;
        return tokens.map(t => ({ name: normalize(t), value: each }));
      }

      return [{ name: normalize(trimmed), value: totalFallback }];
    };

    const methods: Record<string, number> = {};
    filteredSales.forEach(sale => {
      const raw = sale.payment_method || 'Outros';
      const parts = parsePaymentMethod(raw, sale.total || 0);
      parts.forEach(p => {
        methods[p.name] = (methods[p.name] || 0) + p.value;
      });
    });

    const fallbackColors = ['#0EA5E9', '#10B981', '#8B5CF6', '#F59E0B', '#E879A0', '#6366F1', '#94A3B8'];

    return Object.entries(methods)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({
        name,
        value,
        color: colorMap[name] || fallbackColors[i % fallbackColors.length],
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
