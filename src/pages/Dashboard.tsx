import {
  ClipboardList,
  Clock,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { useDashboard } from '@/hooks/useDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type { OrderStatus } from '@/hooks/useServiceOrders';

export default function Dashboard() {
  const { data, isLoading } = useDashboard();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral da sua assistência técnica</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral da sua assistência técnica</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="OS em Andamento"
          value={data.osEmAndamento}
          icon={ClipboardList}
          variant="primary"
        />
        <StatCard
          title="Aguardando Autorização"
          value={data.osAguardandoAutorizacao}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Concluídas Hoje"
          value={data.osConcluidasHoje}
          icon={CheckCircle2}
          variant="success"
        />
        <StatCard
          title="Faturamento Hoje"
          value={formatCurrency(data.faturamentoDia)}
          icon={DollarSign}
          variant="info"
        />
        <StatCard
          title="Faturamento Mês"
          value={formatCurrency(data.faturamentoMes)}
          icon={TrendingUp}
          variant="primary"
        />
        <StatCard
          title="Lucro Estimado"
          value={formatCurrency(data.lucroEstimado)}
          icon={Wallet}
          variant="success"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendas por Dia */}
        <div className="bg-card rounded-xl border p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-foreground mb-4">Vendas por Dia</h3>
          <div className="h-64">
            {data.vendasPorDia.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.vendasPorDia}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="dia" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Valor']}
                  />
                  <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Nenhuma venda registrada nos últimos 7 dias
              </div>
            )}
          </div>
        </div>

        {/* Status das OS */}
        <div className="bg-card rounded-xl border p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-foreground mb-4">Status das Ordens</h3>
          <div className="h-64 flex items-center">
            {data.statusOS.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.statusOS}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="quantidade"
                    label={({ status, quantidade }) => `${status}: ${quantidade}`}
                    labelLine={false}
                  >
                    {data.statusOS.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cor} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center w-full text-muted-foreground">
                Nenhuma ordem de serviço cadastrada
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Serviços mais realizados */}
        <div className="bg-card rounded-xl border p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-foreground mb-4">Serviços Mais Realizados</h3>
          <div className="space-y-4">
            {data.servicosMaisRealizados.length > 0 ? (
              data.servicosMaisRealizados.map((servico, index) => {
                const maxQuantidade = data.servicosMaisRealizados[0]?.quantidade || 1;
                return (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-foreground">{servico.nome}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(servico.quantidade / maxQuantidade) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-8">{servico.quantidade}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-muted-foreground text-center py-4">
                Nenhum serviço realizado ainda
              </div>
            )}
          </div>
        </div>

        {/* Últimas OS */}
        <div className="bg-card rounded-xl border p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-foreground mb-4">Últimas Ordens de Serviço</h3>
          <div className="space-y-3">
            {data.ultimasOS.length > 0 ? (
              data.ultimasOS.map((os) => (
                <div
                  key={os.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-primary">OS-{String(os.order_number).padStart(3, '0')}</span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{os.client_name}</p>
                      <p className="text-xs text-muted-foreground">{os.device_model}</p>
                    </div>
                  </div>
                  <StatusBadge status={os.status as OrderStatus} size="sm" />
                </div>
              ))
            ) : (
              <div className="text-muted-foreground text-center py-4">
                Nenhuma ordem de serviço cadastrada
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
