// src/components/gov/schools/SchoolStats.tsx

import { SchoolStats as SchoolStatsType } from '@/types/gov/school';
import { Building2, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { KPIGrid } from '../dashboard/KPIGrid';

interface SchoolStatsProps {
  stats: SchoolStatsType;
  className?: string;
}

export function SchoolStats({ stats, className }: SchoolStatsProps) {
  const items = [
    {
      label: 'Total Schools',
      value: stats.total,
      icon: <Building2 className="h-4 w-4" />,
      color: 'var(--tz-navy)',
    },
    {
      label: 'Active Schools',
      value: stats.active,
      icon: <CheckCircle className="h-4 w-4" />,
      color: 'var(--tz-green)',
    },
    {
      label: 'Suspended Schools',
      value: stats.suspended,
      icon: <XCircle className="h-4 w-4" />,
      color: 'var(--tz-gold)',
    },
    {
      label: 'School Types',
      value: Object.keys(stats.byType).length,
      icon: <TrendingUp className="h-4 w-4" />,
      color: 'var(--tz-blue)',
    },
  ];

  return (
    <KPIGrid 
      items={items} 
      columns={4} 
      className={className}
    />
  );
}
