import { useState } from 'react';
import { Building, Users, Shield, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImportMockData } from '@/components/ImportMockData';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { UserManagement } from '@/components/settings/UserManagement';
import { CompanySettings } from '@/components/settings/CompanySettings';
import { useAuth } from '@/contexts/AuthContext';

export default function Configuracoes() {
  const { role } = useAuth();
  const { toast } = useToast();
  const isAdmin = role === 'admin';

  const [permissoes, setPermissoes] = useState({
    financeiroAdmin: true,
    financeiroTecnico: false,
    descontoAdmin: true,
    descontoTecnico: false,
    descontoCaixa: true,
    excluirOsAdmin: true,
    excluirOsTecnico: false,
  });

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
          {isAdmin && (
            <>
              <TabsTrigger value="permissoes" className="gap-2">
                <Shield className="w-4 h-4" />
                Permissões
              </TabsTrigger>
              <TabsTrigger value="dados" className="gap-2">
                <Database className="w-4 h-4" />
                Dados
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* Empresa Tab */}
        <TabsContent value="empresa">
          <CompanySettings />
        </TabsContent>

        {/* Usuários Tab */}
        <TabsContent value="usuarios">
          <UserManagement />
        </TabsContent>

        {/* Permissões Tab - Only for admins */}
        {isAdmin && (
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
        )}

        {/* Dados Tab - Only for admins */}
        {isAdmin && (
          <TabsContent value="dados">
            <ImportMockData />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
