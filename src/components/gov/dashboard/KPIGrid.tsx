// src/components/gov/dashboard/KPIGrid.tsx

import { ReactNode } from 'react';
import { KPICard } from '../shared/KPICard';
import { StatsGrid } from '../shared/StatsGrid';

interface KPIItem {
  label: string;
  value: string | number;
  icon?: ReactNode;
  color?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
}

interface KPIGridProps {
  items: KPIItem[];
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}

export function KPIGrid({ items, columns = 4, className }: KPIGridProps) {
  return (
    <StatsGrid columns={columns} className={className}>
      {items.map((item, index) => (
        <KPICard
          key={index}
          label={item.label}
          value={item.value}
          icon={item.icon}
          color={item.color}
          trend={item.trend}
        />
      ))}
    </StatsGrid>
  );
}
