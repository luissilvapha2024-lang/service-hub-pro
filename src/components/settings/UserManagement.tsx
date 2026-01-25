import { useState } from 'react';
import { Plus, MoreHorizontal, Edit, UserCog, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import { useAuth } from '@/contexts/AuthContext';
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
import { cn } from '@/lib/utils';

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

export function UserManagement() {
  const { users, isLoading, createUser, updateUserRole } = useCompanyUsers();
  const { role: currentUserRole, user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<typeof users[0] | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'tecnico',
  });

  const isAdmin = currentUserRole === 'admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newUser.password.length < 6) {
      return;
    }

    await createUser.mutateAsync(newUser);
    setNewUser({ name: '', email: '', password: '', role: 'tecnico' });
    setIsDialogOpen(false);
  };

  const handleEditRole = async (role: string) => {
    if (!selectedUser) return;
    
    await updateUserRole.mutateAsync({ userId: selectedUser.user_id, role });
    setIsEditDialogOpen(false);
    setSelectedUser(null);
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border shadow-soft p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border shadow-soft overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Usuários do Sistema</h3>
        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    minLength={6}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
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
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createUser.isPending}>
                    {createUser.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      'Adicionar'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Função</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Alterar função de <strong>{selectedUser?.name}</strong>
            </p>
            <Select
              defaultValue={selectedUser?.role}
              onValueChange={handleEditRole}
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
        </DialogContent>
      </Dialog>

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
            {isAdmin && (
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                Ações
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={isAdmin ? 4 : 3} className="py-8 text-center text-muted-foreground">
                Nenhum usuário cadastrado
              </td>
            </tr>
          ) : (
            users.map((usuario) => (
              <tr
                key={usuario.id}
                className="border-b last:border-0 hover:bg-muted/30 transition-colors"
              >
                <td className="py-3 px-4">
                  <span className="font-medium text-foreground">{usuario.name}</span>
                  {usuario.user_id === user?.id && (
                    <span className="ml-2 text-xs text-muted-foreground">(você)</span>
                  )}
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
                {isAdmin && (
                  <td className="py-3 px-4">
                    <div className="flex justify-end">
                      {usuario.user_id !== user?.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="gap-2"
                              onClick={() => {
                                setSelectedUser(usuario);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <UserCog className="w-4 h-4" /> Alterar Função
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
