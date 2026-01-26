import { useAuth } from '@/contexts/AuthContext';

export type PermissionKey = 
  | 'ver_dashboard'
  | 'ver_clientes'
  | 'ver_servicos'
  | 'ver_produtos'
  | 'ver_ordens_servico'
  | 'ver_pdv'
  | 'ver_financeiro' 
  | 'ver_relatorios'
  | 'ver_configuracoes';

export type AppRole = 'admin' | 'tecnico' | 'caixa';

// Static role-based permissions - applies to all companies
const rolePermissions: Record<AppRole, PermissionKey[]> = {
  admin: [
    'ver_dashboard',
    'ver_clientes',
    'ver_servicos',
    'ver_produtos',
    'ver_ordens_servico',
    'ver_pdv',
    'ver_financeiro',
    'ver_relatorios',
    'ver_configuracoes',
  ],
  tecnico: [
    'ver_clientes',
    'ver_servicos',
    'ver_produtos',
    'ver_ordens_servico',
  ],
  caixa: [
    'ver_clientes',
    'ver_servicos',
    'ver_produtos',
    'ver_ordens_servico',
    'ver_pdv',
  ],
};

export function usePermissions() {
  const { role } = useAuth();

  const hasPermission = (permissionKey: PermissionKey): boolean => {
    if (!role) return false;
    return rolePermissions[role]?.includes(permissionKey) ?? false;
  };

  return {
    isLoading: false,
    hasPermission,
    role,
  };
}
