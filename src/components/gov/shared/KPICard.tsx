import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  color?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  className?: string;
}

export function KPICard({ 
  label, 
  value, 
  icon, 
  color = 'var(--tz-green)', 
  trend,
  className 
}: KPICardProps) {
  return (
    <div className={cn('rounded-2xl border bg-card p-5', className)}>
      {icon && (
        <div 
          className="h-9 w-9 rounded-lg flex items-center justify-center text-white"
          style={{ background: color }}
        >
          {icon}
        </div>
      )}
      <div className="mt-3 text-3xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">
        {label}
      </div>
      {trend && (
        <div className={cn(
          'text-xs mt-2 flex items-center gap-1',
          trend.direction === 'up' ? 'text-green-600' : 
          trend.direction === 'down' ? 'text-red-600' : 
          'text-gray-500'
        )}>
          {trend.direction === 'up' && ''}
          {trend.direction === 'down' && ''}
          {trend.direction === 'neutral' && ''}
          {trend.value}%
        </div>
      )}
    </div>
  );
}
