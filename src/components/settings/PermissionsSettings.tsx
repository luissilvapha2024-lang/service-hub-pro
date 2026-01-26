import { useState, useEffect, useCallback } from 'react';
import { Loader2, Info, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePermissions, PermissionKey, AppRole } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

interface PermissionConfig {
  key: PermissionKey;
  label: string;
  description: string;
  category: 'acesso' | 'acoes';
}

const permissionConfig: PermissionConfig[] = [
  // Permissões de Acesso a Módulos
  { 
    key: 'ver_financeiro', 
    label: 'Financeiro', 
    description: 'Permite visualizar receitas, despesas e fluxo de caixa',
    category: 'acesso'
  },
  { 
    key: 'ver_relatorios', 
    label: 'Relatórios', 
    description: 'Permite acessar relatórios e análises do sistema',
    category: 'acesso'
  },
  // Permissões de Ações
  { 
    key: 'dar_desconto', 
    label: 'Aplicar Desconto', 
    description: 'Permite conceder descontos nas vendas do PDV',
    category: 'acoes'
  },
  { 
    key: 'excluir_os', 
    label: 'Excluir OS', 
    description: 'Permite excluir ordens de serviço do sistema',
    category: 'acoes'
  },
];

const roles: { key: AppRole; label: string; color: string }[] = [
  { key: 'admin', label: 'Administrador', color: 'bg-primary/10 text-primary' },
  { key: 'tecnico', label: 'Técnico', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  { key: 'caixa', label: 'Caixa', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
];

export function PermissionsSettings() {
  const { getPermission, updatePermission, isLoading } = usePermissions();
  const { toast } = useToast();
  const [localPermissions, setLocalPermissions] = useState<Record<string, boolean>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Memoize the function to get initial permissions
  const getInitialPermissions = useCallback(() => {
    const initial: Record<string, boolean> = {};
    permissionConfig.forEach(perm => {
      roles.forEach(role => {
        const key = `${perm.key}_${role.key}`;
        initial[key] = getPermission(perm.key, role.key);
      });
    });
    return initial;
  }, [getPermission]);

  // Initialize local permissions from database
  useEffect(() => {
    if (isLoading) return;
    setLocalPermissions(getInitialPermissions());
    setHasChanges(false);
  }, [isLoading, getInitialPermissions]);

  const handleToggle = (permKey: PermissionKey, roleKey: AppRole) => {
    const key = `${permKey}_${roleKey}`;
    setLocalPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates: Promise<void>[] = [];
      
      permissionConfig.forEach(perm => {
        roles.forEach(role => {
          const key = `${perm.key}_${role.key}`;
          const currentValue = localPermissions[key];
          const dbValue = getPermission(perm.key, role.key);
          
          if (currentValue !== dbValue) {
            updates.push(
              updatePermission.mutateAsync({
                permissionKey: perm.key,
                targetRole: role.key,
                enabled: currentValue,
              })
            );
          }
        });
      });

      await Promise.all(updates);
      setHasChanges(false);
      toast({
        title: 'Permissões salvas',
        description: 'As alterações foram aplicadas a todos os usuários da empresa.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as permissões. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setLocalPermissions(getInitialPermissions());
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border p-8 shadow-soft flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const accessPermissions = permissionConfig.filter(p => p.category === 'acesso');
  const actionPermissions = permissionConfig.filter(p => p.category === 'acoes');

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-card rounded-xl border p-6 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Controle de Permissões</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Configure o acesso de cada função aos módulos e ações do sistema. 
              As alterações serão aplicadas <strong>automaticamente a todos os usuários</strong> da sua empresa com o respectivo cargo.
            </p>
          </div>
          {hasChanges && (
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="outline" onClick={handleReset} disabled={isSaving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar Alterações
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-muted/30 rounded-lg px-4 py-3 flex flex-wrap items-center gap-4 sm:gap-6 text-sm">
        <span className="text-muted-foreground font-medium">Legenda:</span>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary/15 border-2 border-primary flex items-center justify-center">
            <Check className="w-4 h-4 text-primary" />
          </div>
          <span className="text-foreground">Permitido</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-muted/50 border-2 border-muted-foreground/20 flex items-center justify-center">
            <X className="w-4 h-4 text-muted-foreground/50" />
          </div>
          <span className="text-foreground">Negado</span>
        </div>
        <span className="text-muted-foreground text-xs">(Clique para alternar)</span>
      </div>

      {/* Permissions Tables */}
      <div className="bg-card rounded-xl border p-6 shadow-soft space-y-8">
        {/* Access Permissions */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Acesso a Módulos
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left pb-4 pr-4 font-medium text-foreground min-w-[200px]">
                    Permissão
                  </th>
                  {roles.map(role => (
                    <th key={role.key} className="pb-4 px-2 text-center">
                      <span className={cn(
                        "inline-flex px-3 py-1.5 rounded-full text-xs font-medium",
                        role.color
                      )}>
                        {role.label}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {accessPermissions.map((perm) => (
                  <tr key={perm.key} className="group">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{perm.label}</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" className="cursor-help">
                                <Info className="w-4 h-4 text-muted-foreground" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-[250px]">
                              <p>{perm.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </td>
                    {roles.map(role => {
                      const key = `${perm.key}_${role.key}`;
                      const isEnabled = localPermissions[key] ?? false;
                      
                      return (
                        <td key={role.key} className="py-4 px-2">
                          <div className="flex justify-center">
                            <button
                              type="button"
                              onClick={() => handleToggle(perm.key, role.key)}
                              className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200",
                                "hover:scale-110 active:scale-95 border-2 cursor-pointer",
                                isEnabled 
                                  ? "bg-primary/15 border-primary text-primary hover:bg-primary/25" 
                                  : "bg-muted/50 border-muted-foreground/20 text-muted-foreground/50 hover:bg-muted"
                              )}
                              title={isEnabled ? 'Clique para negar' : 'Clique para permitir'}
                            >
                              {isEnabled ? (
                                <Check className="w-5 h-5" />
                              ) : (
                                <X className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Action Permissions */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Ações do Sistema
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left pb-4 pr-4 font-medium text-foreground min-w-[200px]">
                    Permissão
                  </th>
                  {roles.map(role => (
                    <th key={role.key} className="pb-4 px-2 text-center">
                      <span className={cn(
                        "inline-flex px-3 py-1.5 rounded-full text-xs font-medium",
                        role.color
                      )}>
                        {role.label}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {actionPermissions.map((perm) => (
                  <tr key={perm.key} className="group">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{perm.label}</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" className="cursor-help">
                                <Info className="w-4 h-4 text-muted-foreground" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-[250px]">
                              <p>{perm.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </td>
                    {roles.map(role => {
                      const key = `${perm.key}_${role.key}`;
                      const isEnabled = localPermissions[key] ?? false;
                      
                      return (
                        <td key={role.key} className="py-4 px-2">
                          <div className="flex justify-center">
                            <button
                              type="button"
                              onClick={() => handleToggle(perm.key, role.key)}
                              className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200",
                                "hover:scale-110 active:scale-95 border-2 cursor-pointer",
                                isEnabled 
                                  ? "bg-primary/15 border-primary text-primary hover:bg-primary/25" 
                                  : "bg-muted/50 border-muted-foreground/20 text-muted-foreground/50 hover:bg-muted"
                              )}
                              title={isEnabled ? 'Clique para negar' : 'Clique para permitir'}
                            >
                              {isEnabled ? (
                                <Check className="w-5 h-5" />
                              ) : (
                                <X className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Importante:</strong> As permissões são aplicadas por cargo. Ao alterar uma permissão, 
            todos os usuários da sua empresa com aquele cargo serão afetados imediatamente após salvar.
          </div>
        </div>
      </div>
    </div>
  );
}
