// src/hooks/gov/useGovApprovals.ts

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { approvalService } from '@/lib/gov/approval.service';
import { ApprovalFilters, ApprovalAction } from '@/types/gov/approval';
import { toast } from 'sonner';

export function useGovApprovals(filters?: ApprovalFilters) {
  const queryClient = useQueryClient();

  const { data: approvals, isLoading, error } = useQuery({
    queryKey: ['gov-approvals', filters],
    queryFn: () => approvalService.getApprovals(filters),
  });

  const { data: stats } = useQuery({
    queryKey: ['gov-approval-stats'],
    queryFn: () => approvalService.getApprovalStats(),
  });

  const approveRequest = useMutation({
    mutationFn: ({ id, comments }: { id: string; comments?: string }) =>
      approvalService.approveRequest(id, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gov-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['gov-approval-stats'] });
      toast.success('Request approved successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to approve request');
    },
  });

  const rejectRequest = useMutation({
    mutationFn: ({ id, comments }: { id: string; comments?: string }) =>
      approvalService.rejectRequest(id, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gov-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['gov-approval-stats'] });
      toast.success('Request rejected');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reject request');
    },
  });

  const bulkApprove = useMutation({
    mutationFn: ({ ids, comments }: { ids: string[]; comments?: string }) =>
      approvalService.bulkApprove(ids, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gov-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['gov-approval-stats'] });
      toast.success('Requests approved successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to approve requests');
    },
  });

  const bulkReject = useMutation({
    mutationFn: ({ ids, comments }: { ids: string[]; comments?: string }) =>
      approvalService.bulkReject(ids, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gov-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['gov-approval-stats'] });
      toast.success('Requests rejected');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reject requests');
    },
  });

  const getApproval = useQuery({
    queryKey: ['gov-approval-detail'],
    queryFn: () => approvalService.getApprovalById,
    enabled: false,
  });

  return {
    approvals: approvals || [],
    isLoading,
    error,
    stats,
    approveRequest: approveRequest.mutate,
    isApproving: approveRequest.isPending,
    rejectRequest: rejectRequest.mutate,
    isRejecting: rejectRequest.isPending,
    bulkApprove: bulkApprove.mutate,
    isBulkApproving: bulkApprove.isPending,
    bulkReject: bulkReject.mutate,
    isBulkRejecting: bulkReject.isPending,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['gov-approvals'] }),
  };
}
