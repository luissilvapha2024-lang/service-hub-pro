import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Clock, DollarSign, MoreHorizontal, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useServices, type Service } from '@/hooks/useServices';
import { Switch } from '@/components/ui/switch';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export default function Servicos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingServico, setEditingServico] = useState<Service | null>(null);

  const { services, isLoading, createService, updateService, deleteService } = useServices();

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    estimated_time: '',
    description: '',
  });

  const filteredServicos = services.filter(
    (servico) =>
      servico.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (servico.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const resetForm = () => {
    setFormData({ name: '', price: '', estimated_time: '', description: '' });
    setEditingServico(null);
  };

  const handleOpenDialog = (servico?: Service) => {
    if (servico) {
      setEditingServico(servico);
      setFormData({
        name: servico.name,
        price: String(servico.price),
        estimated_time: servico.estimated_time ? String(servico.estimated_time) : '',
        description: servico.description || '',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      name: formData.name,
      price: parseFloat(formData.price),
      estimated_time: formData.estimated_time ? parseInt(formData.estimated_time) : null,
      description: formData.description || null,
    };

    if (editingServico) {
      updateService.mutate({ id: editingServico.id, ...data });
    } else {
      createService.mutate(data);
    }
    
    handleCloseDialog();
  };

  const toggleAtivo = (servico: Service) => {
    updateService.mutate({ id: servico.id, is_active: !servico.is_active });
  };

  const handleDelete = (id: string) => {
    deleteService.mutate(id);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatTime = (minutes: number | null) => {
    if (!minutes) return '-';
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins}min` : `${hours}h`;
  };

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
          <h1 className="text-2xl font-bold text-foreground">Serviços</h1>
          <p className="text-muted-foreground">Gerencie os serviços oferecidos</p>
        </div>
        <Button className="gap-2" onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4" />
          Novo Serviço
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingServico ? 'Editar Serviço' : 'Cadastrar Serviço'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do serviço</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Valor (R$)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimated_time">Tempo médio (minutos)</Label>
                  <Input
                    id="estimated_time"
                    type="number"
                    value={formData.estimated_time}
                    onChange={(e) => setFormData({ ...formData, estimated_time: e.target.value })}
                    placeholder="60"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do serviço..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createService.isPending || updateService.isPending}>
                  {(createService.isPending || updateService.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {editingServico ? 'Atualizar' : 'Salvar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou descrição..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Services Table */}
      {filteredServicos.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhum serviço encontrado.</p>
          <Button variant="link" onClick={() => handleOpenDialog()}>
            Cadastrar primeiro serviço
          </Button>
        </div>
      ) : (
        <div className="bg-card rounded-xl border shadow-soft overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                  Serviço
                </th>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                  Valor
                </th>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                  Tempo
                </th>
                <th className="text-center py-4 px-6 text-sm font-medium text-muted-foreground">
                  Ativo
                </th>
                <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredServicos.map((servico) => (
                <tr
                  key={servico.id}
                  className={cn(
                    'border-b last:border-0 hover:bg-muted/30 transition-colors',
                    !servico.is_active && 'opacity-50'
                  )}
                >
                  <td className="py-4 px-6">
                    <div>
                      <span className="font-medium text-foreground">{servico.name}</span>
                      {servico.description && (
                        <p className="text-sm text-muted-foreground truncate max-w-xs">
                          {servico.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1 text-foreground">
                      <DollarSign className="w-4 h-4 text-success" />
                      {formatCurrency(Number(servico.price))}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {formatTime(servico.estimated_time)}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex justify-center">
                      <Switch
                        checked={servico.is_active}
                        onCheckedChange={() => toggleAtivo(servico)}
                      />
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2" onClick={() => handleOpenDialog(servico)}>
                            <Edit className="w-4 h-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2 text-destructive"
                            onClick={() => handleDelete(servico.id)}
                          >
                            <Trash2 className="w-4 h-4" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
