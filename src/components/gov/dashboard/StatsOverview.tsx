// src/components/gov/dashboard/StatsOverview.tsx

import { cn } from '@/lib/utils';
import { Users, Building2, FileCheck2, Clock, TrendingUp, Activity } from 'lucide-react';

interface StatsOverviewProps {
  stats: {
    students: {
      total: number;
      active: number;
      newThisMonth: number;
    };
    schools: {
      total: number;
      active: number;
    };
    approvals: {
      pending: number;
      approved: number;
      rejected: number;
    };
  };
  className?: string;
}

export function StatsOverview({ stats, className }: StatsOverviewProps) {
  const tiles = [
    {
      label: 'Total Students',
      value: stats.students.total,
      subValue: ${stats.students.active} active,
      icon: Users,
      color: 'var(--tz-green)',
    },
    {
      label: 'New This Month',
      value: stats.students.newThisMonth,
      subValue: 'students registered',
      icon: TrendingUp,
      color: 'var(--tz-blue)',
    },
    {
      label: 'Schools',
      value: stats.schools.total,
      subValue: ${stats.schools.active} active,
      icon: Building2,
      color: 'var(--tz-navy)',
    },
    {
      label: 'Pending Approvals',
      value: stats.approvals.pending,
      subValue: ${stats.approvals.approved} approved,  rejected,
      icon: FileCheck2,
      color: 'var(--tz-gold)',
    },
  ];

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {tiles.map((tile, index) => (
        <div
          key={index}
          className="rounded-2xl border bg-card p-5 transition-all hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div
              className="h-9 w-9 rounded-lg flex items-center justify-center text-white"
              style={{ background: tile.color }}
            >
              <tile.icon className="h-4 w-4" />
            </div>
            <span className="text-2xl font-bold">{tile.value}</span>
          </div>
          <div className="mt-2">
            <div className="text-sm font-medium">{tile.label}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{tile.subValue}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
