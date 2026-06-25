// src/components/gov/approvals/ApprovalStats.tsx

import { ApprovalStats as ApprovalStatsType } from '@/types/gov/approval';
import { Clock, CheckCircle, XCircle, FileCheck2 } from 'lucide-react';
import { KPIGrid } from '../dashboard/KPIGrid';

interface ApprovalStatsProps {
  stats: ApprovalStatsType;
  className?: string;
}

export function ApprovalStats({ stats, className }: ApprovalStatsProps) {
  const items = [
    {
      label: 'Pending',
      value: stats.pending,
      icon: <Clock className="h-4 w-4" />,
      color: 'var(--tz-gold)',
    },
    {
      label: 'Approved',
      value: stats.approved,
      icon: <CheckCircle className="h-4 w-4" />,
      color: 'var(--tz-green)',
    },
    {
      label: 'Rejected',
      value: stats.rejected,
      icon: <XCircle className="h-4 w-4" />,
      color: 'var(--tz-red)',
    },
    {
      label: 'Avg Resolution',
      value: stats.avgResolutionTime > 0 ? ${Math.round(stats.avgResolutionTime)}h : '',
      icon: <FileCheck2 className="h-4 w-4" />,
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
