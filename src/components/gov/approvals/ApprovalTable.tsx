// src/components/gov/approvals/ApprovalTable.tsx

import { ApprovalRequest } from '@/types/gov/approval';
import { DataTable } from '../shared/DataTable';
import { StatusBadge } from '../shared/StatusBadge';
import { Clock, AlertCircle, CheckCircle, XCircle, Flag } from 'lucide-react';

interface ApprovalTableProps {
  approvals: ApprovalRequest[];
  onRowClick?: (approval: ApprovalRequest) => void;
  className?: string;
  emptyMessage?: string;
}

const PRIORITY_COLORS: Record<string, { color: string; label: string }> = {
  low: { color: 'text-blue-600', label: 'Low' },
  normal: { color: 'text-green-600', label: 'Normal' },
  high: { color: 'text-amber-600', label: 'High' },
  urgent: { color: 'text-red-600', label: 'Urgent' },
};

const TYPE_LABELS: Record<string, string> = {
  student_update: 'Student Update',
  school_update: 'School Update',
  transfer: 'Transfer',
  registration: 'Registration',
};

export function ApprovalTable({ 
  approvals, 
  onRowClick, 
  className,
  emptyMessage = 'No approval requests found'
}: ApprovalTableProps) {
  const columns = [
    {
      key: 'request_type',
      header: 'Type',
      render: (approval: ApprovalRequest) => (
        <div>
          <div className="text-sm font-medium">{TYPE_LABELS[approval.request_type] || approval.request_type}</div>
          <div className="text-xs text-muted-foreground font-mono">{approval.id.slice(0, 8)}</div>
        </div>
      )
    },
    {
      key: 'changes',
      header: 'Details',
      render: (approval: ApprovalRequest) => {
        const changes = approval.changes || {};
        const changeKeys = Object.keys(changes);
        return (
          <div>
            <div className="text-sm">
              {changeKeys.length > 0 ? (
                changeKeys.slice(0, 3).map(key => (
                  <span key={key} className="inline-block mr-1">
                    <span className="text-xs font-mono bg-muted px-1 rounded">{key}</span>
                    <span className="text-xs text-muted-foreground">: {String(changes[key]).slice(0, 20)}</span>
                  </span>
                ))
              ) : (
                <span className="text-muted-foreground text-sm">No changes</span>
              )}
              {changeKeys.length > 3 && (
                <span className="text-xs text-muted-foreground">+{changeKeys.length - 3} more</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {approval.requested_by_name || 'Unknown'} requested
            </div>
          </div>
        );
      }
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (approval: ApprovalRequest) => {
        const priority = PRIORITY_COLORS[approval.priority] || PRIORITY_COLORS.normal;
        return (
          <div className="flex items-center gap-1">
            <Flag className={h-3.5 w-3.5 } />
            <span className={	ext-xs font-medium }>{priority.label}</span>
          </div>
        );
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (approval: ApprovalRequest) => (
        <StatusBadge status={approval.status} />
      )
    },
    {
      key: 'requested_at',
      header: 'Requested',
      render: (approval: ApprovalRequest) => (
        <div className="text-xs text-muted-foreground">
          {new Date(approval.requested_at).toLocaleString('en-TZ', {
            dateStyle: 'short',
            timeStyle: 'short'
          })}
        </div>
      )
    }
  ];

  return (
    <DataTable
      data={approvals}
      columns={columns}
      onRowClick={onRowClick}
      emptyMessage={emptyMessage}
      className={className}
    />
  );
}
