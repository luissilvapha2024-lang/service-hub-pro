import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Edit, MoreHorizontal, Filter, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useServiceOrders, statusConfig, ORDER_STATUS_VALUES, type ServiceOrder, type OrderStatus } from '@/hooks/useServiceOrders';
import { useClients } from '@/hooks/useClients';
import { useServices } from '@/hooks/useServices';
import { StatusBadge } from '@/components/ui/status-badge';
import { WhatsAppButton, generateStatusMessage } from '@/components/WhatsAppButton';
import { useAuth } from '@/contexts/AuthContext';
import { TableSkeleton } from '@/components/ui/page-skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function OrdensServico() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { orders, isLoading, createOrder, updateOrderStatus } = useServiceOrders();
  const { clients } = useClients();
  const { services } = useServices();
  const { profile } = useAuth();

  const [formData, setFormData] = useState({
    client_id: '',
    device_model: '',
    device_imei: '',
    reported_issue: '',
    observations: '',
    serviceIds: [] as string[],
  });

  const filteredOrdens = orders.filter((os) => {
    const matchesSearch =
      String(os.order_number).includes(searchTerm) ||
      os.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.device_model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.device_imei?.includes(searchTerm);
    const matchesStatus = statusFilter === 'todos' || os.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getWhatsAppMessage = (os: ServiceOrder) => {
    return generateStatusMessage(
      os.client?.name || 'Cliente',
      os.order_number,
      os.device_model,
      os.status,
      profile?.company_name || undefined
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedServices = services.filter((s) => formData.serviceIds.includes(s.id));
    const valorEstimado = selectedServices.reduce((acc, s) => acc + Number(s.price), 0);

    createOrder.mutate({
      order: {
        client_id: formData.client_id || null,
        device_model: formData.device_model,
        device_imei: formData.device_imei || null,
        reported_issue: formData.reported_issue,
        observations: formData.observations || null,
        estimated_value: valorEstimado,
      },
      services: selectedServices.map((s) => ({
        service_id: s.id,
        service_name: s.name,
        price: Number(s.price),
        quantity: 1,
      })),
    });

    setFormData({
      client_id: '',
      device_model: '',
      device_imei: '',
      reported_issue: '',
      observations: '',
      serviceIds: [],
    });
    setIsDialogOpen(false);
  };

  const handleUpdateStatus = (id: string, newStatus: string) => {
    // Ensure we always use valid enum values
    if (ORDER_STATUS_VALUES.includes(newStatus as OrderStatus)) {
      updateOrderStatus.mutate({ id, status: newStatus as OrderStatus });
    }
  };

  const formatCurrency = (value: number | null) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ordens de Serviço</h1>
          <p className="text-muted-foreground">Gerencie as ordens de serviço</p>
        </div>
        <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          Nova OS
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova Ordem de Serviço</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Select
                    value={formData.client_id}
                    onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.name} - {cliente.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="device_model">Aparelho</Label>
                  <Input
                    id="device_model"
                    value={formData.device_model}
                    onChange={(e) => setFormData({ ...formData, device_model: e.target.value })}
                    placeholder="iPhone 13 Pro"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="device_imei">IMEI (opcional)</Label>
                <Input
                  id="device_imei"
                  value={formData.device_imei}
                  onChange={(e) => setFormData({ ...formData, device_imei: e.target.value })}
                  placeholder="123456789012345"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reported_issue">Defeito relatado</Label>
                <Textarea
                  id="reported_issue"
                  value={formData.reported_issue}
                  onChange={(e) => setFormData({ ...formData, reported_issue: e.target.value })}
                  placeholder="Descreva o problema reportado pelo cliente..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Serviços</Label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-auto">
                  {services.filter((s) => s.is_active).map((servico) => (
                    <label
                      key={servico.id}
                      className="flex items-center gap-2 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.serviceIds.includes(servico.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              serviceIds: [...formData.serviceIds, servico.id],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              serviceIds: formData.serviceIds.filter((id) => id !== servico.id),
                            });
                          }
                        }}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium">{servico.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {formatCurrency(Number(servico.price))}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  placeholder="Observações adicionais..."
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createOrder.isPending}>
                  {createOrder.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Criar OS
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por OS, cliente, aparelho ou IMEI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {Object.entries(statusConfig).map(([key, value]) => (
              <SelectItem key={key} value={key}>
                {value.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* OS List */}
      {filteredOrdens.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhuma ordem de serviço encontrada.</p>
          <Button variant="link" onClick={() => setIsDialogOpen(true)}>
            Criar primeira OS
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrdens.map((os) => (
            <div
              key={os.id}
              className="bg-card rounded-xl border p-5 shadow-soft hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/ordens/${os.id}`)}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="text-center">
                    <span className="text-lg font-bold text-primary">OS-{String(os.order_number).padStart(3, '0')}</span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(os.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="border-l border-border pl-4">
                    <h3 className="font-semibold text-foreground">{os.client?.name || 'Cliente não informado'}</h3>
                    <p className="text-sm text-muted-foreground">{os.device_model}</p>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                      {os.reported_issue}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <StatusBadge status={os.status} />

                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">
                      {formatCurrency(os.estimated_value)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {os.client?.phone && (
                      <WhatsAppButton
                        phone={os.client.phone}
                        message={getWhatsAppMessage(os)}
                        variant="success"
                        size="icon"
                        className="h-9 w-9"
                      >
                        <span className="sr-only">Enviar WhatsApp</span>
                      </WhatsAppButton>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-9 w-9">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          className="gap-2"
                          onClick={() => navigate(`/ordens/${os.id}`)}
                        >
                          <Edit className="w-4 h-4" /> Editar
                        </DropdownMenuItem>
                        <div className="px-2 py-1.5">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Alterar status
                          </p>
                          {Object.entries(statusConfig).map(([key, value]) => (
                            <button
                              key={key}
                              className="w-full text-left px-2 py-1 text-sm rounded hover:bg-muted transition-colors"
                              onClick={() => handleUpdateStatus(os.id, key as OrderStatus)}
                            >
                              {value.label}
                            </button>
                          ))}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
