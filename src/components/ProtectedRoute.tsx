import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions, PermissionKey } from '@/hooks/usePermissions';

// Routes that require specific permissions
const routePermissions: Record<string, PermissionKey> = {
  '/financeiro': 'ver_financeiro',
  '/relatorios': 'ver_relatorios',
};

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const location = useLocation();

  if (isLoading || permissionsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if current route requires permission
  const requiredPermission = routePermissions[location.pathname];
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
