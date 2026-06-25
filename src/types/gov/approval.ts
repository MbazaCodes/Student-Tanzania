// src/types/gov/approval.ts

export interface ApprovalRequest {
  id: string;
  request_type: 'student_update' | 'school_update' | 'transfer' | 'registration';
  entity_id: string;
  entity_type: 'student' | 'school';
  changes: Record<string, any>;
  requested_by: string;
  requested_by_name?: string;
  requested_at: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_by_name?: string;
  reviewed_at?: string;
  comments?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  risk_score?: number;
}

export interface ApprovalFilters {
  status?: 'pending' | 'approved' | 'rejected';
  type?: 'student_update' | 'school_update' | 'transfer' | 'registration';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface ApprovalStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  avgResolutionTime: number;
}

export interface ApprovalAction {
  id: string;
  comments?: string;
}
