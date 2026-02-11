import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useServiceOrders, statusConfig, ORDER_STATUS_VALUES, type OrderStatus, isStatusTransitionAllowed, getAllowedStatuses } from '@/hooks/useServiceOrders';
import { useClients } from '@/hooks/useClients';
import { useServices } from '@/hooks/useServices';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { OrderPhotoUpload } from '@/components/OrderPhotoUpload';
import { useWhatsAppTemplates } from '@/hooks/useWhatsAppTemplates';
import { StatusBadge } from '@/components/ui/status-badge';
import { WhatsAppTemplateSelector } from '@/components/WhatsAppTemplateSelector';
import { printOrder } from '@/utils/printOrder';

interface OrderPhoto {
  id: string;
  file_path: string;
  file_name: string;
  description: string | null;
  created_at: string;
}

export default function EditarOS() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();
  const { orders, updateOrder, updateOrderStatus, isLoading: ordersLoading } = useServiceOrders();
  const { clients } = useClients();
  const { services } = useServices();
  const { buildMessage } = useWhatsAppTemplates();

  const [isSaving, setIsSaving] = useState(false);
  const [photos, setPhotos] = useState<OrderPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);

  const order = orders.find((o) => o.id === id);

  const [formData, setFormData] = useState({
    client_id: '',
    device_model: '',
    device_imei: '',
    reported_issue: '',
    observations: '',
    diagnosis: '',
    internal_notes: '',
    estimated_value: 0,
    final_value: 0,
    status: 'em_analise' as OrderStatus,
    serviceIds: [] as string[],
  });

  useEffect(() => {
    if (order) {
      setFormData({
        client_id: order.client_id || '',
        device_model: order.device_model,
        device_imei: order.device_imei || '',
        reported_issue: order.reported_issue,
        observations: order.observations || '',
        diagnosis: order.diagnosis || '',
        internal_notes: order.internal_notes || '',
        estimated_value: Number(order.estimated_value) || 0,
        final_value: Number(order.final_value) || 0,
        status: order.status,
        serviceIds: order.order_services?.map((s) => s.service_id).filter(Boolean) as string[] || [],
      });
    }
  }, [order]);

  const fetchPhotos = async () => {
    if (!id) return;
    setLoadingPhotos(true);
    try {
      const { data, error } = await supabase
        .from('order_photos')
        .select('*')
        .eq('order_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar fotos:', error);
    } finally {
      setLoadingPhotos(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setIsSaving(true);
    try {
      await updateOrder.mutateAsync({
        id,
        client_id: formData.client_id || null,
        device_model: formData.device_model,
        device_imei: formData.device_imei || null,
        reported_issue: formData.reported_issue,
        observations: formData.observations || null,
        diagnosis: formData.diagnosis || null,
        internal_notes: formData.internal_notes || null,
        estimated_value: formData.estimated_value,
        final_value: formData.final_value,
        status: formData.status,
      });

      navigate('/ordens');
    } catch (error) {
      // Error is handled by the mutation
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (!ORDER_STATUS_VALUES.includes(newStatus as OrderStatus)) return;
    if (!order) return;
    // Validate transition against the original saved status
    if (!isStatusTransitionAllowed(order.status, newStatus as OrderStatus)) return;
    setFormData({ ...formData, status: newStatus as OrderStatus });
  };

  const allowedStatuses = order ? getAllowedStatuses(order.status) : ORDER_STATUS_VALUES;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (ordersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Button variant="ghost" onClick={() => navigate('/ordens')} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Ordem de serviço não encontrada.</p>
        </div>
      </div>
    );
  }

  const selectedServices = services.filter((s) => formData.serviceIds.includes(s.id));
  const calculatedValue = selectedServices.reduce((acc, s) => acc + Number(s.price), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/ordens')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              OS-{String(order.order_number).padStart(3, '0')}
            </h1>
            <p className="text-muted-foreground">
              Criada em {new Date(order.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => printOrder({
              orderNumber: order.order_number,
              createdAt: order.created_at,
              clientName: order.client?.name,
              clientPhone: order.client?.phone,
              deviceModel: formData.device_model,
              deviceImei: formData.device_imei || undefined,
              reportedIssue: formData.reported_issue,
              diagnosis: formData.diagnosis || undefined,
              observations: formData.observations || undefined,
              status: formData.status,
              estimatedValue: formData.estimated_value || undefined,
              finalValue: formData.final_value || undefined,
              services: order.order_services?.map(s => ({
                service_name: s.service_name,
                price: Number(s.price),
                quantity: s.quantity,
              })),
              companyName: profile?.company_name || undefined,
              companyPhone: profile?.company_phone || undefined,
              companyAddress: profile?.company_address || undefined,
            })}
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir OS
          </Button>
          <StatusBadge status={formData.status} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cliente e Aparelho */}
            <div className="bg-card rounded-xl border p-6 shadow-soft space-y-4">
              <h3 className="font-semibold text-foreground">Informações do Cliente</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label htmlFor="device_model">Aparelho *</Label>
                  <Input
                    id="device_model"
                    value={formData.device_model}
                    onChange={(e) => setFormData({ ...formData, device_model: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="device_imei">IMEI</Label>
                <Input
                  id="device_imei"
                  value={formData.device_imei}
                  onChange={(e) => setFormData({ ...formData, device_imei: e.target.value })}
                />
              </div>
            </div>

            {/* Defeito e Diagnóstico */}
            <div className="bg-card rounded-xl border p-6 shadow-soft space-y-4">
              <h3 className="font-semibold text-foreground">Defeito e Diagnóstico</h3>
              
              <div className="space-y-2">
                <Label htmlFor="reported_issue">Defeito Relatado *</Label>
                <Textarea
                  id="reported_issue"
                  value={formData.reported_issue}
                  onChange={(e) => setFormData({ ...formData, reported_issue: e.target.value })}
                  required
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnóstico Técnico</Label>
                <Textarea
                  id="diagnosis"
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  placeholder="Descreva o diagnóstico após análise..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observations">Observações para o Cliente</Label>
                <Textarea
                  id="observations"
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  placeholder="Observações visíveis na OS do cliente..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="internal_notes">Notas Internas (somente equipe)</Label>
                <Textarea
                  id="internal_notes"
                  value={formData.internal_notes}
                  onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                  placeholder="Notas internas para a equipe técnica..."
                  rows={2}
                  className="bg-muted/50"
                />
              </div>
            </div>

            {/* Fotos */}
            <div className="bg-card rounded-xl border p-6 shadow-soft">
              <OrderPhotoUpload
                orderId={id!}
                photos={photos}
                onPhotosChange={fetchPhotos}
              />
            </div>

            {/* Serviços */}
            <div className="bg-card rounded-xl border p-6 shadow-soft space-y-4">
              <h3 className="font-semibold text-foreground">Serviços</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-auto">
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

              {selectedServices.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Valor calculado: <span className="font-bold text-foreground">{formatCurrency(calculatedValue)}</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-card rounded-xl border p-6 shadow-soft space-y-4">
              <h3 className="font-semibold text-foreground">Status</h3>
              
              <div className="space-y-2">
                {Object.entries(statusConfig).map(([key, config]) => {
                  const isAllowed = allowedStatuses.includes(key as OrderStatus);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => isAllowed && handleStatusChange(key as OrderStatus)}
                      disabled={!isAllowed}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        formData.status === key
                          ? config.bgClass + ' font-medium'
                          : isAllowed
                            ? 'hover:bg-muted'
                            : 'opacity-40 cursor-not-allowed line-through'
                      }`}
                    >
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Valores */}
            <div className="bg-card rounded-xl border p-6 shadow-soft space-y-4">
              <h3 className="font-semibold text-foreground">Valores</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="estimated_value">Valor Estimado</Label>
                  <Input
                    id="estimated_value"
                    type="number"
                    step="0.01"
                    value={formData.estimated_value}
                    onChange={(e) => setFormData({ ...formData, estimated_value: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="final_value">Valor Final</Label>
                  <Input
                    id="final_value"
                    type="number"
                    step="0.01"
                    value={formData.final_value}
                    onChange={(e) => setFormData({ ...formData, final_value: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            {/* WhatsApp */}
            {order.client?.phone && (
              <WhatsAppTemplateSelector
                phone={order.client.phone}
                clientName={order.client.name || 'Cliente'}
                orderNumber={order.order_number}
                deviceModel={formData.device_model}
                currentStatus={formData.status}
                companyName={profile?.company_name || undefined}
                buildMessage={buildMessage}
              />
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button type="submit" disabled={isSaving} className="w-full">
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/ordens')}
                className="w-full"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
