import { useState } from 'react';
import { Plus, Search, Phone, Mail, MapPin, MoreHorizontal, Edit, Trash2, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useClients, type Client } from '@/hooks/useClients';
import { PageSkeleton } from '@/components/ui/page-skeleton';
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

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Client | null>(null);
  
  const { clients, isLoading, createClient, updateClient, deleteClient } = useClients();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    cpf: '',
    address: '',
  });

  const filteredClientes = clients.filter(
    (cliente) =>
      cliente.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.phone.includes(searchTerm) ||
      (cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '', cpf: '', address: '' });
    setEditingCliente(null);
  };

  const handleOpenDialog = (cliente?: Client) => {
    if (cliente) {
      setEditingCliente(cliente);
      setFormData({
        name: cliente.name,
        phone: cliente.phone,
        email: cliente.email || '',
        cpf: cliente.cpf || '',
        address: cliente.address || '',
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
    
    if (editingCliente) {
      updateClient.mutate({
        id: editingCliente.id,
        name: formData.name,
        phone: formData.phone,
        email: formData.email || null,
        cpf: formData.cpf || null,
        address: formData.address || null,
      });
    } else {
      createClient.mutate({
        name: formData.name,
        phone: formData.phone,
        email: formData.email || null,
        cpf: formData.cpf || null,
        address: formData.address || null,
      });
    }
    
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    deleteClient.mutate(id);
  };

  if (isLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">Gerencie sua base de clientes</p>
        </div>
        <Button className="gap-2" onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4" />
          Novo Cliente
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCliente ? 'Editar Cliente' : 'Cadastrar Cliente'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone (WhatsApp)</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="11999999999"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createClient.isPending || updateClient.isPending}>
                  {(createClient.isPending || updateClient.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {editingCliente ? 'Atualizar' : 'Salvar'}
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
          placeholder="Buscar por nome, telefone ou e-mail..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Clients Grid */}
      {filteredClientes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhum cliente encontrado.</p>
          <Button variant="link" onClick={() => handleOpenDialog()}>
            Cadastrar primeiro cliente
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClientes.map((cliente) => (
            <div
              key={cliente.id}
              className="bg-card rounded-xl border p-5 shadow-soft hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">{cliente.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Cadastrado em {new Date(cliente.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="gap-2">
                      <Eye className="w-4 h-4" /> Ver detalhes
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2" onClick={() => handleOpenDialog(cliente)}>
                      <Edit className="w-4 h-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2 text-destructive"
                      onClick={() => handleDelete(cliente.id)}
                    >
                      <Trash2 className="w-4 h-4" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <a
                    href={`https://wa.me/55${cliente.phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    {cliente.phone}
                  </a>
                </div>
                {cliente.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{cliente.email}</span>
                  </div>
                )}
                {cliente.address && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{cliente.address}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>Última atualização</span>
                <span>{new Date(cliente.updated_at).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
