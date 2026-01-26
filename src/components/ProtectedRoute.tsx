import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions, PermissionKey } from '@/hooks/usePermissions';
import { AccessDenied } from '@/components/AccessDenied';

// Routes mapped to their required permissions
const routePermissions: Record<string, PermissionKey> = {
  '/dashboard': 'ver_dashboard',
  '/clientes': 'ver_clientes',
  '/servicos': 'ver_servicos',
  '/produtos': 'ver_produtos',
  '/ordens': 'ver_ordens_servico',
  '/pdv': 'ver_pdv',
  '/financeiro': 'ver_financeiro',
  '/relatorios': 'ver_relatorios',
  '/configuracoes': 'ver_configuracoes',
};

export function ProtectedRoute() {
  const { isAuthenticated, isLoading, role } = useAuth();
  const { hasPermission } = usePermissions();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect non-admin users from dashboard to ordens
  if (location.pathname === '/dashboard' && role !== 'admin') {
    return <Navigate to="/ordens" replace />;
  }

  // Check if current route requires permission
  const requiredPermission = routePermissions[location.pathname];
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <AccessDenied />;
  }

  return <Outlet />;
}
