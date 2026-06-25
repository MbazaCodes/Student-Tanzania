// src/components/gov/dashboard/DashboardHeader.tsx

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
}

export function DashboardHeader({
  title,
  subtitle,
  actions,
  className,
  primaryAction,
}: DashboardHeaderProps) {
  return (
    <div className={cn('rounded-2xl bg-primary text-primary-foreground p-6', className)}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">
            Government Portal
          </div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm opacity-80 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {primaryAction && (
            <Button 
              asChild 
              variant="secondary"
              onClick={primaryAction.onClick}
            >
              <span>
                {primaryAction.icon || <Plus className="h-4 w-4 mr-1" />}
                {primaryAction.label}
              </span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
