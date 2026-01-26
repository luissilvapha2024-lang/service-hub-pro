import { Building, Users, Database } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImportMockData } from '@/components/ImportMockData';
import { UserManagement } from '@/components/settings/UserManagement';
import { CompanySettings } from '@/components/settings/CompanySettings';
import { useAuth } from '@/contexts/AuthContext';

export default function Configuracoes() {
  const { role } = useAuth();
  const isAdmin = role === 'admin';

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
            <TabsTrigger value="dados" className="gap-2">
              <Database className="w-4 h-4" />
              Dados
            </TabsTrigger>
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
