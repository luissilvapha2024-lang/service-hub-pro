import { useState, useMemo } from 'react';
import { Calendar, Download, BarChart3, PieChart, TrendingUp, TrendingDown, Users, FileSpreadsheet, FileText, CalendarIcon, Filter, X, Search, Loader2, Package, DollarSign, Percent, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { exportToCSV, formatCurrencyForExport } from '@/utils/exportCSV';
import { exportToPDF } from '@/utils/exportPDF';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useClients } from '@/hooks/useClients';
import { useServices } from '@/hooks/useServices';
import { useReports } from '@/hooks/useReports';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const periodLabels: Record<string, string> = {
  semana: 'Esta semana',
  mes: 'Este mês',
  trimestre: 'Este trimestre',
  ano: 'Este ano',
  personalizado: 'Personalizado',
};

export default function Relatorios() {
  const [period, setPeriod] = useState('mes');
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(new Date()));
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('all');
  const { toast } = useToast();

  const { clients } = useClients();
  const { services } = useServices();

  const {
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
  } = useReports({ startDate, endDate, selectedClientId, selectedServiceId });

  const uniqueServices = useMemo(() => {
    const seen = new Set<string>();
    return services.filter(service => {
      if (seen.has(service.name)) return false;
      seen.add(service.name);
      return true;
    });
  }, [services]);

  const hasActiveFilters = selectedClientId !== 'all' || selectedServiceId !== 'all';

  const clearFilters = () => {
    setSelectedClientId('all');
    setSelectedServiceId('all');
  };

  const handlePeriodChange = (value: string) => {
    setPeriod(value);
    const now = new Date();
    switch (value) {
      case 'semana': setStartDate(startOfWeek(now, { locale: ptBR })); setEndDate(endOfWeek(now, { locale: ptBR })); break;
      case 'mes': setStartDate(startOfMonth(now)); setEndDate(endOfMonth(now)); break;
      case 'trimestre': setStartDate(startOfQuarter(now)); setEndDate(endOfQuarter(now)); break;
      case 'ano': setStartDate(startOfYear(now)); setEndDate(endOfYear(now)); break;
    }
  };

  const getDisplayPeriod = () => {
    if (period === 'personalizado' && startDate && endDate) {
      return `${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`;
    }
    return periodLabels[period];
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Export helpers
  const exportData = {
    lucroProdutos: {
      title: 'Lucro por Produto',
      headers: ['Produto', 'Qtd', 'Receita (R$)', 'Custo (R$)', 'Lucro (R$)'],
      data: productProfitData.products.map(p => [
        p.name, p.quantity, formatCurrencyForExport(p.revenue), formatCurrencyForExport(p.cost), formatCurrencyForExport(p.profit),
      ]),
    },
    resumo: {
      title: 'Resumo Financeiro',
      headers: ['Métrica', 'Valor (R$)'],
      data: [
        ['Faturamento Total', formatCurrencyForExport(summaryMetrics.totalRevenue)],
        ['Lucro Produtos', formatCurrencyForExport(summaryMetrics.productProfit)],
        ['Receita OS', formatCurrencyForExport(summaryMetrics.totalOSRevenue)],
        ['Despesas', formatCurrencyForExport(summaryMetrics.expenses)],
      ],
    },
    clientes: {
      title: 'Clientes por Valor',
      headers: ['Cliente', 'Telefone', 'Total OS', 'Valor Total (R$)', 'Última Visita'],
      data: topClients.map(c => [c.name, c.phone, c.osCount, formatCurrencyForExport(c.totalValue), new Date(c.lastVisit).toLocaleDateString('pt-BR')]),
    },
    mensal: {
      title: 'Relatório Mensal',
      headers: ['Mês', 'Receita Vendas', 'Lucro Vendas', 'Receita OS', 'Despesas'],
      data: monthlyData.map(m => [m.mes, formatCurrencyForExport(m.vendasReceita), formatCurrencyForExport(m.vendasLucro), formatCurrencyForExport(m.osReceita), formatCurrencyForExport(m.despesas)]),
    },
  };

  const handleExport = (type: keyof typeof exportData, formatType: 'csv' | 'pdf') => {
    const data = exportData[type];
    const filename = `relatorio-${type}-${period}`;
    if (formatType === 'csv') {
      exportToCSV({ filename, headers: data.headers, data: data.data });
    } else {
      exportToPDF({ filename, title: data.title, headers: data.headers, data: data.data, period: getDisplayPeriod() });
    }
    toast({ title: 'Exportado!', description: `${data.title} baixado em ${formatType.toUpperCase()}.` });
  };

  const ExportButton = ({ type }: { type: keyof typeof exportData }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background border z-50">
        <DropdownMenuItem onClick={() => handleExport(type, 'csv')}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          CSV (Excel)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport(type, 'pdf')}>
          <FileText className="w-4 h-4 mr-2" />
          PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const ChartSkeleton = () => (
    <div className="h-64 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Carregando dados...</span>
      </div>
    </div>
  );

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios Avançados</h1>
          <p className="text-muted-foreground">Análises de lucro, receita e desempenho</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semana">Esta semana</SelectItem>
              <SelectItem value="mes">Este mês</SelectItem>
              <SelectItem value="trimestre">Trimestre</SelectItem>
              <SelectItem value="ano">Este ano</SelectItem>
              <SelectItem value="personalizado">Personalizado</SelectItem>
            </SelectContent>
          </Select>

          {period === 'personalizado' && (
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy") : "Início"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent mode="single" selected={startDate} onSelect={setStartDate} initialFocus className="p-3 pointer-events-auto" locale={ptBR} />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground">até</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy") : "Fim"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent mode="single" selected={endDate} onSelect={setEndDate} initialFocus className="p-3 pointer-events-auto" locale={ptBR} />
                </PopoverContent>
              </Popover>
              <Button onClick={() => toast({ title: 'Período aplicado', description: `Filtrado de ${startDate ? format(startDate, 'dd/MM/yyyy') : '-'} até ${endDate ? format(endDate, 'dd/MM/yyyy') : '-'}` })} disabled={!startDate || !endDate}>
                <Search className="w-4 h-4 mr-2" />
                Pesquisar
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Filtros:</span>
        </div>
        <Select value={selectedClientId} onValueChange={setSelectedClientId}>
          <SelectTrigger className="w-[180px]">
            <Users className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Todos os clientes" />
          </SelectTrigger>
          <SelectContent className="bg-background border z-50">
            <SelectItem value="all">Todos os clientes</SelectItem>
            {clients.map(client => <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
          <SelectTrigger className="w-[180px]">
            <BarChart3 className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Todos os serviços" />
          </SelectTrigger>
          <SelectContent className="bg-background border z-50">
            <SelectItem value="all">Todos os serviços</SelectItem>
            {uniqueServices.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <>
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
              <X className="w-4 h-4 mr-1" /> Limpar filtros
            </Button>
            <div className="flex items-center gap-2 ml-2">
              {selectedClientId !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Cliente: {clients.find(c => c.id === selectedClientId)?.name}
                  <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => setSelectedClientId('all')} />
                </Badge>
              )}
              {selectedServiceId !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Serviço: {uniqueServices.find(s => s.id === selectedServiceId)?.name}
                  <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => setSelectedServiceId('all')} />
                </Badge>
              )}
            </div>
          </>
        )}
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KPICard icon={DollarSign} label="Faturamento Total" value={formatCurrency(summaryMetrics.totalRevenue)} color="primary" />
          <KPICard icon={TrendingUp} label="Lucro Produtos" value={formatCurrency(summaryMetrics.productProfit)} color="success" subtitle={`Margem: ${summaryMetrics.productMargin.toFixed(1)}%`} />
          <KPICard icon={Wallet} label="Receita OS" value={formatCurrency(summaryMetrics.totalOSRevenue)} color="info" subtitle={`${summaryMetrics.completedOrders} concluídas`} />
          <KPICard icon={TrendingDown} label="Despesas" value={formatCurrency(summaryMetrics.expenses)} color="destructive" />
          <KPICard icon={Package} label="Vendas" value={String(summaryMetrics.salesCount)} color="primary" subtitle={formatCurrency(summaryMetrics.totalSalesRevenue)} />
          <KPICard icon={BarChart3} label="Ordens de Serviço" value={String(summaryMetrics.ordersCount)} color="info" subtitle={`${summaryMetrics.completedOrders} finalizadas`} />
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="visao-geral" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="produtos">Lucro Produtos</TabsTrigger>
          <TabsTrigger value="os">Ordens de Serviço</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
        </TabsList>

        {/* Tab: Visão Geral */}
        <TabsContent value="visao-geral" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Receita vs Lucro Mensal */}
            <div className="bg-card rounded-xl border p-6 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Receita vs Lucro Mensal
                </h3>
                <ExportButton type="mensal" />
              </div>
              {isLoading ? <ChartSkeleton /> : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Area type="monotone" dataKey="vendasReceita" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorReceita)" name="Receita Vendas" strokeWidth={2} />
                      <Area type="monotone" dataKey="vendasLucro" stroke="hsl(var(--success))" fillOpacity={1} fill="url(#colorLucro)" name="Lucro Vendas" strokeWidth={2} />
                      <Line type="monotone" dataKey="osReceita" stroke="hsl(var(--info))" strokeWidth={2} dot={{ fill: 'hsl(var(--info))' }} name="Receita OS" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Formas de Pagamento */}
            <div className="bg-card rounded-xl border p-6 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-primary" />
                  Formas de Pagamento
                </h3>
              </div>
              {isLoading ? <ChartSkeleton /> : paymentMethodData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">Nenhuma venda no período</div>
              ) : (
                <div className="h-72 flex items-center">
                  <ResponsiveContainer width="55%" height="100%">
                    <RechartsPieChart>
                      <Pie data={paymentMethodData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                        {paymentMethodData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => formatCurrency(value)} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {paymentMethodData.map(item => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-foreground">{item.name}</span>
                        </div>
                        <span className="font-medium text-foreground">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Despesas vs Receita Mensal */}
            <div className="bg-card rounded-xl border p-6 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-destructive" />
                  Receita vs Despesas Mensal
                </h3>
              </div>
              {isLoading ? <ChartSkeleton /> : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="vendasReceita" fill="hsl(var(--success))" name="Receita" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="despesas" fill="hsl(var(--destructive))" name="Despesas" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Status das OS */}
            <div className="bg-card rounded-xl border p-6 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-primary" />
                  Status das Ordens
                </h3>
              </div>
              {isLoading ? <ChartSkeleton /> : osStatusData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">Nenhuma OS no período</div>
              ) : (
                <div className="h-72 flex items-center">
                  <ResponsiveContainer width="55%" height="100%">
                    <RechartsPieChart>
                      <Pie data={osStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                        {osStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {osStatusData.map(item => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-foreground">{item.name}</span>
                        </div>
                        <span className="font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab: Lucro Produtos */}
        <TabsContent value="produtos" className="space-y-6">
          {/* Product Profit Summary Cards */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card rounded-xl border p-4 shadow-soft">
                <p className="text-sm text-muted-foreground">Receita Produtos</p>
                <p className="text-xl font-bold text-foreground">{formatCurrency(productProfitData.totalRevenue)}</p>
              </div>
              <div className="bg-card rounded-xl border p-4 shadow-soft">
                <p className="text-sm text-muted-foreground">Custo Total</p>
                <p className="text-xl font-bold text-destructive">{formatCurrency(productProfitData.totalCost)}</p>
              </div>
              <div className="bg-card rounded-xl border p-4 shadow-soft">
                <p className="text-sm text-muted-foreground">Lucro Bruto</p>
                <p className="text-xl font-bold text-success">{formatCurrency(productProfitData.totalProfit)}</p>
              </div>
              <div className="bg-card rounded-xl border p-4 shadow-soft">
                <p className="text-sm text-muted-foreground">Margem de Lucro</p>
                <p className="text-xl font-bold text-primary">{productProfitData.margin.toFixed(1)}%</p>
              </div>
            </div>
          )}

          {/* Product Profit Chart */}
          <div className="bg-card rounded-xl border p-6 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Lucro por Produto
              </h3>
              <ExportButton type="lucroProdutos" />
            </div>
            {isLoading ? <ChartSkeleton /> : productProfitData.products.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">Nenhum produto vendido no período</div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productProfitData.products.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `R$${v}`} />
                    <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} width={140} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Receita" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="cost" fill="hsl(var(--destructive))" name="Custo" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="profit" fill="hsl(var(--success))" name="Lucro" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Product Profit Table */}
          <div className="bg-card rounded-xl border shadow-soft overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Detalhamento por Produto
              </h3>
            </div>
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : productProfitData.products.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Nenhum produto vendido no período</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Produto</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Qtd</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Receita</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Custo</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Lucro</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Margem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productProfitData.products.map((p, i) => {
                      const margin = p.revenue > 0 ? ((p.profit / p.revenue) * 100) : 0;
                      return (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 font-medium text-foreground">{p.name}</td>
                          <td className="py-3 px-4 text-center text-muted-foreground">{p.quantity}</td>
                          <td className="py-3 px-4 text-right text-foreground">{formatCurrency(p.revenue)}</td>
                          <td className="py-3 px-4 text-right text-destructive">{formatCurrency(p.cost)}</td>
                          <td className="py-3 px-4 text-right font-semibold text-success">{formatCurrency(p.profit)}</td>
                          <td className="py-3 px-4 text-right">
                            <Badge variant={margin >= 30 ? 'default' : margin >= 15 ? 'secondary' : 'destructive'} className="text-xs">
                              {margin.toFixed(1)}%
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Services Revenue */}
          {serviceProfitData.services.length > 0 && (
            <div className="bg-card rounded-xl border shadow-soft overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Receita por Serviço (Vendas PDV)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Serviço</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Qtd</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Receita</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviceProfitData.services.map((s, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-medium text-foreground">{s.name}</td>
                        <td className="py-3 px-4 text-center text-muted-foreground">{s.quantity}</td>
                        <td className="py-3 px-4 text-right font-semibold text-success">{formatCurrency(s.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tab: Ordens de Serviço */}
        <TabsContent value="os" className="space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card rounded-xl border p-5 shadow-soft">
                <p className="text-sm text-muted-foreground">Receita Total OS</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(osProfitData.totalRevenue)}</p>
                <p className="text-xs text-muted-foreground mt-1">{summaryMetrics.ordersCount} ordens no período</p>
              </div>
              <div className="bg-card rounded-xl border p-5 shadow-soft">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-success" />
                  <p className="text-sm text-muted-foreground">Receita Concluídas</p>
                </div>
                <p className="text-2xl font-bold text-success">{formatCurrency(osProfitData.completedRevenue)}</p>
                <p className="text-xs text-muted-foreground mt-1">{summaryMetrics.completedOrders} finalizadas</p>
              </div>
              <div className="bg-card rounded-xl border p-5 shadow-soft">
                <div className="flex items-center gap-2">
                  <ArrowDownRight className="w-4 h-4 text-warning" />
                  <p className="text-sm text-muted-foreground">Receita Pendente</p>
                </div>
                <p className="text-2xl font-bold text-warning">{formatCurrency(osProfitData.pendingRevenue)}</p>
                <p className="text-xs text-muted-foreground mt-1">{summaryMetrics.ordersCount - summaryMetrics.completedOrders} em andamento</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* OS Revenue Monthly */}
            <div className="bg-card rounded-xl border p-6 shadow-soft">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-info" />
                Receita OS Mensal
              </h3>
              {isLoading ? <ChartSkeleton /> : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="osReceita" fill="hsl(var(--info))" name="Receita OS" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Status Distribution */}
            <div className="bg-card rounded-xl border p-6 shadow-soft">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                <PieChart className="w-5 h-5 text-primary" />
                Distribuição por Status
              </h3>
              {isLoading ? <ChartSkeleton /> : osStatusData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">Nenhuma OS no período</div>
              ) : (
                <div className="h-72 flex items-center">
                  <ResponsiveContainer width="55%" height="100%">
                    <RechartsPieChart>
                      <Pie data={osStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                        {osStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {osStatusData.map(item => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span>{item.name}</span>
                        </div>
                        <span className="font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab: Clientes */}
        <TabsContent value="clientes" className="space-y-6">
          <div className="bg-card rounded-xl border shadow-soft overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Clientes por Valor Total
              </h3>
              <ExportButton type="clientes" />
            </div>
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : topClients.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Nenhum cliente encontrado no período</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Cliente</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Telefone</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Total OS</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Valor Total</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Última Visita</th>
                  </tr>
                </thead>
                <tbody>
                  {topClients.map((c, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground">{c.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{c.phone}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">{c.osCount}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-success">{formatCurrency(c.totalValue)}</td>
                      <td className="py-3 px-4 text-right text-muted-foreground">{new Date(c.lastVisit).toLocaleDateString('pt-BR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, color, subtitle }: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-card rounded-xl border p-4 shadow-soft">
      <div className="flex items-center gap-2 mb-1">
        <div className={`p-1.5 rounded-lg bg-${color}/10`}>
          <Icon className={`w-4 h-4 text-${color}`} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold text-foreground truncate">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  );
}
