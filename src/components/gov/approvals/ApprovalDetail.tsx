// src/components/gov/approvals/ApprovalDetail.tsx

import { ApprovalRequest } from '@/types/gov/approval';
import { StatusBadge } from '../shared/StatusBadge';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  User, 
  Calendar, 
  Flag, 
  MessageSquare,
  X,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface ApprovalDetailProps {
  approval: ApprovalRequest | null;
  onClose?: () => void;
  className?: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-blue-600',
  normal: 'text-green-600',
  high: 'text-amber-600',
  urgent: 'text-red-600',
};

const TYPE_LABELS: Record<string, string> = {
  student_update: 'Student Update',
  school_update: 'School Update',
  transfer: 'Transfer',
  registration: 'Registration',
};

export function ApprovalDetail({ approval, onClose, className }: ApprovalDetailProps) {
  if (!approval) {
    return null;
  }

  const changes = approval.changes || {};
  const changeKeys = Object.keys(changes);

  const infoItems = [
    { 
      label: 'Request Type', 
      value: TYPE_LABELS[approval.request_type] || approval.request_type,
      icon: FileText 
    },
    { 
      label: 'Requested By', 
      value: approval.requested_by_name || 'Unknown',
      icon: User 
    },
    { 
      label: 'Requested At', 
      value: new Date(approval.requested_at).toLocaleString('en-TZ', {
        dateStyle: 'long',
        timeStyle: 'short'
      }),
      icon: Calendar 
    },
    { 
      label: 'Priority', 
      value: approval.priority.toUpperCase(),
      icon: Flag,
      className: PRIORITY_COLORS[approval.priority] || ''
    },
    { 
      label: 'Status', 
      value: <StatusBadge status={approval.status} />,
      icon: approval.status === 'pending' ? Clock : 
            approval.status === 'approved' ? CheckCircle : XCircle
    },
  ];

  if (approval.reviewed_by_name) {
    infoItems.push({
      label: 'Reviewed By',
      value: approval.reviewed_by_name,
      icon: User,
    });
    infoItems.push({
      label: 'Reviewed At',
      value: new Date(approval.reviewed_at!).toLocaleString('en-TZ', {
        dateStyle: 'long',
        timeStyle: 'short'
      }),
      icon: Calendar,
    });
  }

  return (
    <div className={cn('fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto', className)}>
      {/* Header */}
      <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg">Approval Details</h2>
          <p className="text-xs text-muted-foreground font-mono">{approval.id}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-muted rounded-full transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Info Grid */}
        <div className="space-y-4">
          {infoItems.map((item, index) => (
            <div key={index} className="flex items-start gap-3">
              <item.icon className={h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0 } />
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  {item.label}
                </div>
                <div className="text-sm font-medium mt-0.5">
                  {item.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Changes Section */}
        {changeKeys.length > 0 && (
          <div className="border-t pt-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Changes
            </div>
            <div className="space-y-2 bg-muted/30 rounded-lg p-3">
              {changeKeys.map((key) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{key}:</span>
                  <span className="font-mono text-xs">{String(changes[key])}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments Section */}
        {approval.comments && (
          <div className="border-t pt-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5" />
              Comments
            </div>
            <div className="text-sm bg-muted/30 rounded-lg p-3">
              {approval.comments}
            </div>
          </div>
        )}

        {/* Risk Score */}
        {approval.risk_score !== undefined && (
          <div className="border-t pt-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Risk Assessment
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn(
                    'h-full rounded-full',
                    approval.risk_score < 30 ? 'bg-green-500' :
                    approval.risk_score < 60 ? 'bg-amber-500' :
                    'bg-red-500'
                  )}
                  style={{ width: ${Math.min(approval.risk_score, 100)}% }}
                />
              </div>
              <span className="text-sm font-medium">{approval.risk_score}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
