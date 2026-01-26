import { cn } from '@/lib/utils';
import { statusConfig, isValidOrderStatus, type OrderStatus } from '@/hooks/useServiceOrders';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  // Validate status and get config, fallback to em_analise if invalid
  const validStatus = isValidOrderStatus(status) ? status : 'em_analise';
  const config = statusConfig[validStatus];
  
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        config.bgClass,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      )}
    >
      {config.label}
    </span>
  );
}
