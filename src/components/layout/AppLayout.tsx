import { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { PageTransition } from '@/components/PageTransition';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const { isAuthenticated } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const hideHeader = location.pathname === '/pdv';

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      {!hideHeader && <AppHeader sidebarCollapsed={sidebarCollapsed} />}
      <main 
        className={cn(
          "px-6 pb-6 transition-all duration-300",
          hideHeader ? "pt-4" : "pt-20",
          sidebarCollapsed ? "ml-16" : "ml-64"
        )}
      >
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  );
}