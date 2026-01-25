import { useState, useMemo } from 'react';
import { Calendar, Download, BarChart3, PieChart, TrendingUp, Users, FileSpreadsheet, FileText, CalendarIcon, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockDashboardData, mockClientes } from '@/data/mockData';
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
} from 'recharts';
import { exportToCSV, formatCurrencyForExport } from '@/utils/exportCSV';
import { exportToPDF } from '@/utils/exportPDF';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useClients } from '@/hooks/useClients';
import { useServices } from '@/hooks/useServices';
import { Badge } from '@/components/ui/badge';

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

  // Get unique services (remove duplicates by name)
  const uniqueServices = useMemo(() => {
    const seen = new Set<string>();
    return services.filter(service => {
      if (seen.has(service.name)) return false;
      seen.add(service.name);
      return true;
    });
  }, [services]);

  // Check if any filter is active
  const hasActiveFilters = selectedClientId !== 'all' || selectedServiceId !== 'all';

  const clearFilters = () => {
    setSelectedClientId('all');
    setSelectedServiceId('all');
  };

  // Update date range when period changes
  const handlePeriodChange = (value: string) => {
    setPeriod(value);
    const now = new Date();
    
    switch (value) {
      case 'semana':
        setStartDate(startOfWeek(now, { locale: ptBR }));
        setEndDate(endOfWeek(now, { locale: ptBR }));
        break;
      case 'mes':
        setStartDate(startOfMonth(now));
        setEndDate(endOfMonth(now));
        break;
      case 'trimestre':
        setStartDate(startOfQuarter(now));
        setEndDate(endOfQuarter(now));
        break;
      case 'ano':
        setStartDate(startOfYear(now));
        setEndDate(endOfYear(now));
        break;
      // 'personalizado' - keep current dates
    }
  };

  const getDisplayPeriod = () => {
    if (period === 'personalizado' && startDate && endDate) {
      return `${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`;
    }
    return periodLabels[period];
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Mock data for charts
  const vendasMensal = [
    { mes: 'Jan', vendas: 8500, servicos: 6200 },
    { mes: 'Fev', vendas: 9200, servicos: 7100 },
    { mes: 'Mar', vendas: 7800, servicos: 5800 },
    { mes: 'Abr', vendas: 10500, servicos: 8200 },
    { mes: 'Mai', vendas: 11200, servicos: 9100 },
    { mes: 'Jun', vendas: 9800, servicos: 7600 },
  ];

  const osStatus = [
    { name: 'Concluídas', value: 45, color: 'hsl(var(--success))' },
    { name: 'Em Andamento', value: 20, color: 'hsl(var(--primary))' },
    { name: 'Aguardando', value: 15, color: 'hsl(var(--warning))' },
    { name: 'Em Análise', value: 10, color: 'hsl(var(--info))' },
  ];

  const tecnicosProdutividade = [
    { nome: 'Carlos', servicos: 45, valor: 12500 },
    { nome: 'Maria', servicos: 38, valor: 10200 },
    { nome: 'João', servicos: 22, valor: 6800 },
  ];

  const clientesFrequentes = mockClientes.sort((a, b) => b.totalOS - a.totalOS).slice(0, 5);

  // Export data definitions
  const exportData = {
    vendas: {
      title: 'Relatório de Vendas',
      headers: ['Mês', 'Vendas (R$)', 'Serviços (R$)'],
      data: vendasMensal.map(item => [
        item.mes,
        formatCurrencyForExport(item.vendas),
        formatCurrencyForExport(item.servicos),
      ]),
    },
    ordens: {
      title: 'Status das Ordens de Serviço',
      headers: ['Status', 'Quantidade'],
      data: osStatus.map(item => [item.name, item.value]),
    },
    servicos: {
      title: 'Serviços Mais Vendidos',
      headers: ['Serviço', 'Quantidade'],
      data: mockDashboardData.servicosMaisRealizados.map(item => [item.nome, item.quantidade]),
    },
    tecnicos: {
      title: 'Produtividade por Técnico',
      headers: ['Técnico', 'Serviços Realizados', 'Valor Total (R$)'],
      data: tecnicosProdutividade.map(item => [
        item.nome,
        item.servicos,
        formatCurrencyForExport(item.valor),
      ]),
    },
    clientes: {
      title: 'Clientes Mais Frequentes',
      headers: ['Cliente', 'Telefone', 'Total de OS', 'Última Visita'],
      data: clientesFrequentes.map(item => [
        item.nome,
        item.telefone,
        item.totalOS,
        new Date(item.ultimaVisita).toLocaleDateString('pt-BR'),
      ]),
    },
  };

  const handleExport = (type: keyof typeof exportData, format: 'csv' | 'pdf') => {
    const data = exportData[type];
    const filename = `relatorio-${type}-${period}`;

    if (format === 'csv') {
      exportToCSV({
        filename,
        headers: data.headers,
        data: data.data,
      });
    } else {
      exportToPDF({
        filename,
        title: data.title,
        headers: data.headers,
        data: data.data,
        period: getDisplayPeriod(),
      });
    }

    toast({
      title: 'Exportado!',
      description: `${data.title} baixado em ${format.toUpperCase()}.`,
    });
  };

  const ExportButton = ({ type }: { type: keyof typeof exportData }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">Análises e métricas do negócio</p>
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
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[140px] justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy") : "Início"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground">até</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[140px] justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy") : "Fim"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </div>

      {/* Filters Row */}
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
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
          <SelectTrigger className="w-[180px]">
            <BarChart3 className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Todos os serviços" />
          </SelectTrigger>
          <SelectContent className="bg-background border z-50">
            <SelectItem value="all">Todos os serviços</SelectItem>
            {uniqueServices.map((service) => (
              <SelectItem key={service.id} value={service.id}>
                {service.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
            <X className="w-4 h-4 mr-1" />
            Limpar filtros
          </Button>
        )}

        {hasActiveFilters && (
          <div className="flex items-center gap-2 ml-2">
            {selectedClientId !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Cliente: {clients.find(c => c.id === selectedClientId)?.name}
                <X 
                  className="w-3 h-3 cursor-pointer hover:text-destructive" 
                  onClick={() => setSelectedClientId('all')}
                />
              </Badge>
            )}
            {selectedServiceId !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Serviço: {uniqueServices.find(s => s.id === selectedServiceId)?.name}
                <X 
                  className="w-3 h-3 cursor-pointer hover:text-destructive" 
                  onClick={() => setSelectedServiceId('all')}
                />
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendas por Período */}
        <div className="bg-card rounded-xl border p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Vendas por Período
            </h3>
            <ExportButton type="vendas" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={vendasMensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Line
                  type="monotone"
                  dataKey="vendas"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                  name="Vendas"
                />
                <Line
                  type="monotone"
                  dataKey="servicos"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--success))' }}
                  name="Serviços"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status das OS */}
        <div className="bg-card rounded-xl border p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              Status das Ordens
            </h3>
            <ExportButton type="ordens" />
          </div>
          <div className="h-64 flex items-center">
            <ResponsiveContainer width="60%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={osStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {osStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {osStatus.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Serviços mais vendidos */}
        <div className="bg-card rounded-xl border p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Serviços Mais Vendidos
            </h3>
            <ExportButton type="servicos" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockDashboardData.servicosMaisRealizados} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="nome"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  width={120}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="quantidade" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Produtividade por Técnico */}
        <div className="bg-card rounded-xl border p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Produtividade por Técnico
            </h3>
            <ExportButton type="tecnicos" />
          </div>
          <div className="space-y-4">
            {tecnicosProdutividade.map((tecnico, index) => (
              <div key={tecnico.nome} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-foreground">{tecnico.nome}</span>
                    <span className="text-sm text-muted-foreground">
                      {tecnico.servicos} serviços
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(tecnico.servicos / 45) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="font-semibold text-foreground">{formatCurrency(tecnico.valor)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Clientes mais frequentes */}
      <div className="bg-card rounded-xl border shadow-soft overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Clientes Mais Frequentes
          </h3>
          <ExportButton type="clientes" />
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                Cliente
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                Telefone
              </th>
              <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                Total de OS
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                Última Visita
              </th>
            </tr>
          </thead>
          <tbody>
            {clientesFrequentes.map((cliente) => (
              <tr key={cliente.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="py-3 px-4">
                  <span className="font-medium text-foreground">{cliente.nome}</span>
                </td>
                <td className="py-3 px-4 text-muted-foreground">{cliente.telefone}</td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    {cliente.totalOS}
                  </span>
                </td>
                <td className="py-3 px-4 text-right text-muted-foreground">
                  {new Date(cliente.ultimaVisita).toLocaleDateString('pt-BR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
