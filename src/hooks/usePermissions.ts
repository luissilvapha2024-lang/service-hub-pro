import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type PermissionKey = 
  | 'ver_dashboard'
  | 'ver_clientes'
  | 'ver_servicos'
  | 'ver_produtos'
  | 'ver_ordens_servico'
  | 'ver_pdv'
  | 'ver_financeiro' 
  | 'ver_relatorios'
  | 'ver_configuracoes'
  | 'dar_desconto' 
  | 'excluir_os';

export type AppRole = 'admin' | 'tecnico' | 'caixa';

interface Permission {
  id: string;
  company_id: string;
  permission_key: PermissionKey;
  role: AppRole;
  enabled: boolean;
}

interface PermissionMap {
  [key: string]: {
    [role: string]: boolean;
  };
}

export function usePermissions() {
  const { companyId, role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ['company-permissions', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('company_permissions')
        .select('*')
        .eq('company_id', companyId);

      if (error) throw error;
      return data as Permission[];
    },
    enabled: !!companyId,
  });

  // Transform permissions into a map for easy access
  const permissionMap: PermissionMap = permissions.reduce((acc, perm) => {
    if (!acc[perm.permission_key]) {
      acc[perm.permission_key] = {};
    }
    acc[perm.permission_key][perm.role] = perm.enabled;
    return acc;
  }, {} as PermissionMap);

  // Check if current user has a specific permission
  const hasPermission = (permissionKey: PermissionKey): boolean => {
    if (!role) return false;
    
    // Admin always has access unless explicitly disabled
    if (role === 'admin') {
      return permissionMap[permissionKey]?.[role] ?? true;
    }
    
    return permissionMap[permissionKey]?.[role] ?? false;
  };

  // Update a permission
  const updatePermission = useMutation({
    mutationFn: async ({ 
      permissionKey, 
      targetRole, 
      enabled 
    }: { 
      permissionKey: PermissionKey; 
      targetRole: AppRole; 
      enabled: boolean;
    }) => {
      if (!companyId) throw new Error('Company ID not found');

      // Check if permission exists
      const { data: existing } = await supabase
        .from('company_permissions')
        .select('id')
        .eq('company_id', companyId)
        .eq('permission_key', permissionKey)
        .eq('role', targetRole)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('company_permissions')
          .update({ enabled })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('company_permissions')
          .insert({
            company_id: companyId,
            permission_key: permissionKey,
            role: targetRole,
            enabled,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-permissions', companyId] });
      toast({
        title: 'Permissão atualizada',
        description: 'A permissão foi alterada com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar permissão',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Get permission status for a specific role and key
  const getPermission = (permissionKey: PermissionKey, targetRole: AppRole): boolean => {
    return permissionMap[permissionKey]?.[targetRole] ?? false;
  };

  return {
    permissions,
    permissionMap,
    isLoading,
    hasPermission,
    getPermission,
    updatePermission,
  };
}
