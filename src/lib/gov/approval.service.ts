// src/lib/gov/approval.service.ts
import { BaseService } from './base.service';
import { ApprovalRequest, ApprovalFilters, ApprovalStats } from '@/types/gov/approval';

export class ApprovalService extends BaseService {
  async getApprovals(filters?: ApprovalFilters): Promise<ApprovalRequest[]> {
    let query = this.supabase
      .from('approval_requests')
      .select('*, requested_by:auth.users(name), reviewed_by:auth.users(name)');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.type) {
      query = query.eq('request_type', filters.type);
    }

    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }

    if (filters?.dateFrom) {
      query = query.gte('requested_at', filters.dateFrom);
    }

    if (filters?.dateTo) {
      query = query.lte('requested_at', filters.dateTo);
    }

    query = query.order('requested_at', { ascending: false });

    return this.withErrorHandlingArray(() => query);
  }

  async getApprovalById(id: string): Promise<ApprovalRequest> {
    return this.withErrorHandling(() =>
      this.supabase
        .from('approval_requests')
        .select('*, requested_by:auth.users(name), reviewed_by:auth.users(name)')
        .eq('id', id)
        .single()
    );
  }

  async approveRequest(id: string, comments?: string): Promise<ApprovalRequest> {
    return this.withErrorHandling(() =>
      this.supabase
        .from('approval_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          comments: comments || null,
        })
        .eq('id', id)
        .select()
        .single()
    );
  }

  async rejectRequest(id: string, comments?: string): Promise<ApprovalRequest> {
    return this.withErrorHandling(() =>
      this.supabase
        .from('approval_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          comments: comments || null,
        })
        .eq('id', id)
        .select()
        .single()
    );
  }

  async bulkApprove(ids: string[], comments?: string): Promise<void> {
    await this.withErrorHandling(() =>
      this.supabase
        .from('approval_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          comments: comments || null,
        })
        .in('id', ids)
    );
  }

  async bulkReject(ids: string[], comments?: string): Promise<void> {
    await this.withErrorHandling(() =>
      this.supabase
        .from('approval_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          comments: comments || null,
        })
        .in('id', ids)
    );
  }

  async getApprovalStats(): Promise<ApprovalStats> {
    const { data: approvals } = await this.supabase
      .from('approval_requests')
      .select('status, request_type, priority, requested_at, reviewed_at');

    const total = approvals?.length || 0;
    const pending = approvals?.filter(a => a.status === 'pending').length || 0;
    const approved = approvals?.filter(a => a.status === 'approved').length || 0;
    const rejected = approvals?.filter(a => a.status === 'rejected').length || 0;

    const byType: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    approvals?.forEach(a => {
      if (a.request_type) byType[a.request_type] = (byType[a.request_type] || 0) + 1;
      if (a.priority) byPriority[a.priority] = (byPriority[a.priority] || 0) + 1;
    });

    let totalResolutionTime = 0;
    let resolvedCount = 0;

    approvals?.forEach(a => {
      if ((a.status === 'approved' || a.status === 'rejected') && a.requested_at && a.reviewed_at) {
        const requested = new Date(a.requested_at).getTime();
        const reviewed = new Date(a.reviewed_at).getTime();
        totalResolutionTime += (reviewed - requested) / (1000 * 60 * 60);
        resolvedCount++;
      }
    });

    const avgResolutionTime = resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0;

    return {
      pending,
      approved,
      rejected,
      total,
      byType,
      byPriority,
      avgResolutionTime,
    };
  }

  async createApprovalRequest(data: Omit<ApprovalRequest, 'id' | 'requested_at' | 'status'>): Promise<ApprovalRequest> {
    return this.withErrorHandling(() =>
      this.supabase
        .from('approval_requests')
        .insert({
          ...data,
          status: 'pending',
          requested_at: new Date().toISOString(),
        })
        .select()
        .single()
    );
  }
}

export const approvalService = new ApprovalService();
