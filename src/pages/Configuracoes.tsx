import { useState } from 'react';
import { Building, Users, Shield, Plus, Edit, Trash2, MoreHorizontal, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockEmpresa, mockUsuarios } from '@/data/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImportMockData } from '@/components/ImportMockData';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function Configuracoes() {
  const [empresa, setEmpresa] = useState(mockEmpresa);
  const [usuarios, setUsuarios] = useState(mockUsuarios);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newUser, setNewUser] = useState({
    nome: '',
    email: '',
    role: 'tecnico',
  });

  const [permissoes, setPermissoes] = useState({
    financeiroAdmin: true,
    financeiroTecnico: false,
    descontoAdmin: true,
    descontoTecnico: false,
    descontoCaixa: true,
    excluirOsAdmin: true,
    excluirOsTecnico: false,
  });

  const handleSaveEmpresa = () => {
    toast({
      title: 'Configurações salvas',
      description: 'Os dados da empresa foram atualizados.',
    });
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const user = {
      id: String(usuarios.length + 1),
      ...newUser,
      ativo: true,
    };
    setUsuarios([...usuarios, user]);
    setNewUser({ nome: '', email: '', role: 'tecnico' });
    setIsUserDialogOpen(false);
    toast({
      title: 'Usuário adicionado',
      description: `${newUser.nome} foi cadastrado com sucesso.`,
    });
  };

  const toggleUserStatus = (id: string) => {
    setUsuarios(
      usuarios.map((u) => (u.id === id ? { ...u, ativo: !u.ativo } : u))
    );
  };

  const deleteUser = (id: string) => {
    setUsuarios(usuarios.filter((u) => u.id !== id));
    toast({
      title: 'Usuário removido',
      description: 'O usuário foi removido do sistema.',
    });
  };

  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    tecnico: 'Técnico',
    caixa: 'Caixa',
  };

  const roleBadgeColors: Record<string, string> = {
    admin: 'bg-primary/10 text-primary',
    tecnico: 'bg-info/10 text-info',
    caixa: 'bg-success/10 text-success',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações do sistema</p>
      </div>

      <Tabs defaultValue="empresa" className="space-y-6">
        <TabsList>
          <TabsTrigger value="empresa" className="gap-2">
            <Building className="w-4 h-4" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="gap-2">
            <Users className="w-4 h-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="permissoes" className="gap-2">
            <Shield className="w-4 h-4" />
            Permissões
          </TabsTrigger>
          <TabsTrigger value="dados" className="gap-2">
            <Database className="w-4 h-4" />
            Dados
          </TabsTrigger>
        </TabsList>

        {/* Empresa Tab */}
        <TabsContent value="empresa">
          <div className="bg-card rounded-xl border p-6 shadow-soft">
            <h3 className="text-lg font-semibold text-foreground mb-6">Dados da Empresa</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nomeEmpresa">Nome da Empresa</Label>
                <Input
                  id="nomeEmpresa"
                  value={empresa.nome}
                  onChange={(e) => setEmpresa({ ...empresa, nome: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={empresa.cnpj}
                  onChange={(e) => setEmpresa({ ...empresa, cnpj: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefoneEmpresa">Telefone</Label>
                <Input
                  id="telefoneEmpresa"
                  value={empresa.telefone}
                  onChange={(e) => setEmpresa({ ...empresa, telefone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emailEmpresa">E-mail</Label>
                <Input
                  id="emailEmpresa"
                  type="email"
                  value={empresa.email}
                  onChange={(e) => setEmpresa({ ...empresa, email: e.target.value })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="enderecoEmpresa">Endereço</Label>
                <Input
                  id="enderecoEmpresa"
                  value={empresa.endereco}
                  onChange={(e) => setEmpresa({ ...empresa, endereco: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={handleSaveEmpresa}>Salvar Alterações</Button>
            </div>
          </div>
        </TabsContent>

        {/* Usuários Tab */}
        <TabsContent value="usuarios">
          <div className="bg-card rounded-xl border shadow-soft overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Usuários do Sistema</h3>
              <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Novo Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Usuário</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddUser} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nomeUser">Nome</Label>
                      <Input
                        id="nomeUser"
                        value={newUser.nome}
                        onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emailUser">E-mail</Label>
                      <Input
                        id="emailUser"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Função</Label>
                      <Select
                        value={newUser.role}
                        onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="tecnico">Técnico</SelectItem>
                          <SelectItem value="caixa">Caixa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsUserDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit">Adicionar</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Usuário
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    E-mail
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Função
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => (
                  <tr
                    key={usuario.id}
                    className={cn(
                      'border-b last:border-0 hover:bg-muted/30 transition-colors',
                      !usuario.ativo && 'opacity-50'
                    )}
                  >
                    <td className="py-3 px-4">
                      <span className="font-medium text-foreground">{usuario.nome}</span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{usuario.email}</td>
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          roleBadgeColors[usuario.role]
                        )}
                      >
                        {roleLabels[usuario.role]}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center">
                        <Switch
                          checked={usuario.ativo}
                          onCheckedChange={() => toggleUserStatus(usuario.id)}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2">
                              <Edit className="w-4 h-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 text-destructive"
                              onClick={() => deleteUser(usuario.id)}
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
        </TabsContent>

        {/* Permissões Tab */}
        <TabsContent value="permissoes">
          <div className="bg-card rounded-xl border p-6 shadow-soft">
            <h3 className="text-lg font-semibold text-foreground mb-6">Configurar Permissões</h3>
            <div className="space-y-8">
              {/* Ver Financeiro */}
              <div>
                <h4 className="font-medium text-foreground mb-4">Ver Financeiro</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-foreground">Administrador</span>
                    <Switch
                      checked={permissoes.financeiroAdmin}
                      onCheckedChange={(checked) =>
                        setPermissoes({ ...permissoes, financeiroAdmin: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-foreground">Técnico</span>
                    <Switch
                      checked={permissoes.financeiroTecnico}
                      onCheckedChange={(checked) =>
                        setPermissoes({ ...permissoes, financeiroTecnico: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Dar Desconto */}
              <div>
                <h4 className="font-medium text-foreground mb-4">Dar Desconto no PDV</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-foreground">Administrador</span>
                    <Switch
                      checked={permissoes.descontoAdmin}
                      onCheckedChange={(checked) =>
                        setPermissoes({ ...permissoes, descontoAdmin: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-foreground">Técnico</span>
                    <Switch
                      checked={permissoes.descontoTecnico}
                      onCheckedChange={(checked) =>
                        setPermissoes({ ...permissoes, descontoTecnico: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-foreground">Caixa</span>
                    <Switch
                      checked={permissoes.descontoCaixa}
                      onCheckedChange={(checked) =>
                        setPermissoes({ ...permissoes, descontoCaixa: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Excluir OS */}
              <div>
                <h4 className="font-medium text-foreground mb-4">Excluir Ordens de Serviço</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-foreground">Administrador</span>
                    <Switch
                      checked={permissoes.excluirOsAdmin}
                      onCheckedChange={(checked) =>
                        setPermissoes({ ...permissoes, excluirOsAdmin: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-foreground">Técnico</span>
                    <Switch
                      checked={permissoes.excluirOsTecnico}
                      onCheckedChange={(checked) =>
                        setPermissoes({ ...permissoes, excluirOsTecnico: checked })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                onClick={() =>
                  toast({
                    title: 'Permissões salvas',
                    description: 'As permissões foram atualizadas.',
                  })
                }
              >
                Salvar Permissões
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Dados Tab */}
        <TabsContent value="dados">
          <ImportMockData />
        </TabsContent>
      </Tabs>
    </div>
  );
}
