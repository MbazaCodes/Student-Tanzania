// src/components/gov/students/StudentStats.tsx

import { StudentStats as StudentStatsType } from '@/types/gov/student';
import { Users, UserCheck, UserX, TrendingUp } from 'lucide-react';
import { KPIGrid } from '../dashboard/KPIGrid';

interface StudentStatsProps {
  stats: StudentStatsType;
  className?: string;
}

export function StudentStats({ stats, className }: StudentStatsProps) {
  const items = [
    {
      label: 'Total Students',
      value: stats.total,
      icon: <Users className="h-4 w-4" />,
      color: 'var(--tz-navy)',
    },
    {
      label: 'Active Students',
      value: stats.active,
      icon: <UserCheck className="h-4 w-4" />,
      color: 'var(--tz-green)',
    },
    {
      label: 'Inactive Students',
      value: stats.inactive,
      icon: <UserX className="h-4 w-4" />,
      color: 'var(--tz-gold)',
    },
    {
      label: 'New This Month',
      value: stats.newThisMonth,
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
