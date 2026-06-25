// src/components/gov/admins/AdminStats.tsx

import { AdminStats as AdminStatsType } from '@/types/gov/admin';
import { Users, Crown, MapPin, Building2 } from 'lucide-react';
import { KPIGrid } from '../dashboard/KPIGrid';

interface AdminStatsProps {
  stats: AdminStatsType;
  className?: string;
}

export function AdminStats({ stats, className }: AdminStatsProps) {
  const items = [
    {
      label: 'Total Admins',
      value: stats.total,
      icon: <Users className="h-4 w-4" />,
      color: 'var(--tz-navy)',
    },
    {
      label: 'National Admins',
      value: stats.national,
      icon: <Crown className="h-4 w-4" />,
      color: 'var(--tz-green)',
    },
    {
      label: 'Regional Admins',
      value: stats.regional,
      icon: <MapPin className="h-4 w-4" />,
      color: 'var(--tz-gold)',
    },
    {
      label: 'District Admins',
      value: stats.district,
      icon: <Building2 className="h-4 w-4" />,
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
