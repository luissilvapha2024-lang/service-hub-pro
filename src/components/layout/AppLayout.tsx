import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { PageTransition } from '@/components/PageTransition';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const { isAuthenticated } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <AppHeader sidebarCollapsed={sidebarCollapsed} />
      <main 
        className={cn(
          "pt-20 px-6 pb-6 transition-all duration-300",
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