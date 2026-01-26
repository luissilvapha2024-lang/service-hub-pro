import { Search, Moon, Sun, Shield, Wrench, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationsDropdown } from '@/components/NotificationsDropdown';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  sidebarCollapsed?: boolean;
}

const roleConfig = {
  admin: { label: 'Administrador', icon: Shield, color: 'text-primary' },
  tecnico: { label: 'Técnico', icon: Wrench, color: 'text-info' },
  caixa: { label: 'Caixa', icon: CreditCard, color: 'text-success' },
};

export function AppHeader({ sidebarCollapsed }: AppHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { role } = useAuth();

  const roleInfo = role ? roleConfig[role] : null;
  const RoleIcon = roleInfo?.icon;

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-16 bg-card/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-6 transition-all duration-300',
        sidebarCollapsed ? 'left-16' : 'left-64'
      )}
    >
      {/* Search */}
      <div className="relative w-96 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente, OS, IMEI..."
          className="pl-10 bg-background/50 border-border/50 focus:bg-background"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* User Role Badge */}
        {roleInfo && RoleIcon && (
          <div className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border/50',
            roleInfo.color
          )}>
            <RoleIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{roleInfo.label}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </Button>
          
          <NotificationsDropdown />
        </div>
      </div>
    </header>
  );
}
