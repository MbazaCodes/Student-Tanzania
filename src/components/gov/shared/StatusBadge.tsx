import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'suspended' | 'approved' | 'rejected';
  className?: string;
}

const statusColors = {
  active: 'bg-emerald-100 text-emerald-800',
  inactive: 'bg-red-100 text-red-800',
  pending: 'bg-amber-100 text-amber-800',
  suspended: 'bg-gray-100 text-gray-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize',
      statusColors[status] || 'bg-gray-100 text-gray-800',
      className
    )}>
      {status}
    </span>
  );
}
