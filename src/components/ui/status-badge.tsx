import { cn } from '@/lib/utils';
import { statusConfig, type OrderStatus } from '@/hooks/useServiceOrders';

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];
  
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
