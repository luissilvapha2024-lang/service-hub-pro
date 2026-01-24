import { useState } from 'react';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTransactions, type TransactionType } from '@/hooks/useTransactions';
import { StatCard } from '@/components/ui/stat-card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function Financeiro() {
  const [filterType, setFilterType] = useState<string>('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { transactions, isLoading, createTransaction, entradas, saidas, saldo } = useTransactions();

  const [formData, setFormData] = useState({
    type: 'entrada' as TransactionType,
    category: '',
    description: '',
    amount: '',
    payment_method: '',
  });

  const filteredTransacoes = transactions.filter((t) =>
    filterType === 'todos' ? true : t.type === filterType
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTransaction.mutate({
      type: formData.type,
      category: formData.category,
      description: formData.description,
      amount: parseFloat(formData.amount),
      payment_method: formData.payment_method || null,
    });
    setFormData({ type: 'entrada', category: '', description: '', amount: '', payment_method: '' });
    setIsDialogOpen(false);
  };

  // Generate chart data from transactions (last 6 months)
  const generateChartData = () => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const now = new Date();
    const data = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = months[date.getMonth()];
      
      const monthTransactions = transactions.filter((t) => {
        const tDate = new Date(t.created_at);
        return tDate.getMonth() === date.getMonth() && tDate.getFullYear() === date.getFullYear();
      });

      const monthEntradas = monthTransactions
        .filter((t) => t.type === 'entrada')
        .reduce((acc, t) => acc + Number(t.amount), 0);
      
      const monthSaidas = monthTransactions
        .filter((t) => t.type === 'saida')
        .reduce((acc, t) => acc + Number(t.amount), 0);

      data.push({ mes: monthName, entradas: monthEntradas, saidas: monthSaidas });
    }

    return data;
  };

  const chartData = generateChartData();

  const categoriasEntrada = ['Serviço', 'Venda', 'Outros'];
  const categoriasSaida = ['Peças', 'Aluguel', 'Luz', 'Água', 'Internet', 'Salários', 'Outros'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
          <p className="text-muted-foreground">Controle de entradas e saídas</p>
        </div>
        <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          Novo Lançamento
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Lançamento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={formData.type === 'entrada' ? 'default' : 'outline'}
                    className={cn(formData.type === 'entrada' && 'bg-success hover:bg-success/90')}
                    onClick={() => setFormData({ ...formData, type: 'entrada', category: '' })}
                  >
                    <ArrowUpRight className="w-4 h-4 mr-2" />
                    Entrada
                  </Button>
                  <Button
                    type="button"
                    variant={formData.type === 'saida' ? 'default' : 'outline'}
                    className={cn(formData.type === 'saida' && 'bg-destructive hover:bg-destructive/90')}
                    onClick={() => setFormData({ ...formData, type: 'saida', category: '' })}
                  >
                    <ArrowDownRight className="w-4 h-4 mr-2" />
                    Saída
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {(formData.type === 'entrada' ? categoriasEntrada : categoriasSaida).map(
                      (cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor (R$)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Forma de pagamento</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="Cartão Crédito">Cartão Crédito</SelectItem>
                      <SelectItem value="Cartão Débito">Cartão Débito</SelectItem>
                      <SelectItem value="Boleto">Boleto</SelectItem>
                      <SelectItem value="Débito Automático">Débito Automático</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createTransaction.isPending}>
                  {createTransaction.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Salvar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Entradas"
          value={formatCurrency(entradas)}
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          title="Saídas"
          value={formatCurrency(saidas)}
          icon={TrendingDown}
          variant="warning"
        />
        <StatCard
          title="Saldo"
          value={formatCurrency(saldo)}
          icon={Wallet}
          variant={saldo >= 0 ? 'primary' : 'warning'}
        />
      </div>

      {/* Chart */}
      <div className="bg-card rounded-xl border p-6 shadow-soft">
        <h3 className="text-lg font-semibold text-foreground mb-4">Fluxo de Caixa</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                </linearGradient>
              </defs>
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
              <Area
                type="monotone"
                dataKey="entradas"
                stroke="hsl(var(--success))"
                fillOpacity={1}
                fill="url(#colorEntradas)"
                name="Entradas"
              />
              <Area
                type="monotone"
                dataKey="saidas"
                stroke="hsl(var(--destructive))"
                fillOpacity={1}
                fill="url(#colorSaidas)"
                name="Saídas"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-card rounded-xl border shadow-soft overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Últimas Transações</h3>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="entrada">Entradas</SelectItem>
              <SelectItem value="saida">Saídas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {filteredTransacoes.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhuma transação encontrada.
          </div>
        ) : (
          <div className="divide-y">
            {filteredTransacoes.map((transacao) => (
              <div
                key={transacao.id}
                className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      transacao.type === 'entrada'
                        ? 'bg-success/10 text-success'
                        : 'bg-destructive/10 text-destructive'
                    )}
                  >
                    {transacao.type === 'entrada' ? (
                      <ArrowUpRight className="w-5 h-5" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{transacao.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {transacao.category} {transacao.payment_method && `• ${transacao.payment_method}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      'font-semibold',
                      transacao.type === 'entrada' ? 'text-success' : 'text-destructive'
                    )}
                  >
                    {transacao.type === 'entrada' ? '+' : '-'}
                    {formatCurrency(Number(transacao.amount))}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(transacao.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
