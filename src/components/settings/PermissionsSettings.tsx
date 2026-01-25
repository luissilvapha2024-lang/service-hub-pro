import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { usePermissions, PermissionKey, AppRole } from '@/hooks/usePermissions';

const permissionConfig: { key: PermissionKey; label: string; roles: AppRole[] }[] = [
  { 
    key: 'ver_financeiro', 
    label: 'Ver Financeiro', 
    roles: ['admin', 'tecnico', 'caixa'] 
  },
  { 
    key: 'ver_relatorios', 
    label: 'Ver Relatórios', 
    roles: ['admin', 'tecnico', 'caixa'] 
  },
  { 
    key: 'dar_desconto', 
    label: 'Dar Desconto no PDV', 
    roles: ['admin', 'tecnico', 'caixa'] 
  },
  { 
    key: 'excluir_os', 
    label: 'Excluir Ordens de Serviço', 
    roles: ['admin', 'tecnico'] 
  },
];

const roleLabels: Record<AppRole, string> = {
  admin: 'Administrador',
  tecnico: 'Técnico',
  caixa: 'Caixa',
};

export function PermissionsSettings() {
  const { getPermission, updatePermission, isLoading } = usePermissions();
  const [localPermissions, setLocalPermissions] = useState<Record<string, boolean>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize local permissions from database only once when data loads
  useEffect(() => {
    if (isLoading || isInitialized) return;
    
    const initial: Record<string, boolean> = {};
    permissionConfig.forEach(perm => {
      perm.roles.forEach(role => {
        const key = `${perm.key}_${role}`;
        initial[key] = getPermission(perm.key, role);
      });
    });
    setLocalPermissions(initial);
    setIsInitialized(true);
  }, [isLoading, isInitialized, getPermission]);

  const handleToggle = (permKey: PermissionKey, role: AppRole, checked: boolean) => {
    const key = `${permKey}_${role}`;
    setLocalPermissions(prev => ({ ...prev, [key]: checked }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates: Promise<void>[] = [];
      
      permissionConfig.forEach(perm => {
        perm.roles.forEach(role => {
          const key = `${perm.key}_${role}`;
          const currentValue = localPermissions[key];
          const dbValue = getPermission(perm.key, role);
          
          if (currentValue !== dbValue) {
            updates.push(
              updatePermission.mutateAsync({
                permissionKey: perm.key,
                targetRole: role,
                enabled: currentValue,
              })
            );
          }
        });
      });

      await Promise.all(updates);
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border p-8 shadow-soft flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border p-6 shadow-soft">
      <h3 className="text-lg font-semibold text-foreground mb-6">Configurar Permissões</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Configure quais funções podem acessar cada recurso do sistema. As alterações serão aplicadas imediatamente aos usuários.
      </p>
      
      <div className="space-y-8">
        {permissionConfig.map((perm) => (
          <div key={perm.key}>
            <h4 className="font-medium text-foreground mb-4">{perm.label}</h4>
            <div className="space-y-3">
              {perm.roles.map((role) => {
                const key = `${perm.key}_${role}`;
                return (
                  <div 
                    key={key} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <span className="text-foreground">{roleLabels[role]}</span>
                    <Switch
                      checked={localPermissions[key] ?? false}
                      onCheckedChange={(checked) => handleToggle(perm.key, role, checked)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
        >
          {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Salvar Permissões
        </Button>
      </div>
    </div>
  );
}
