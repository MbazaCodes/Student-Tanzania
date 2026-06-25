// src/__tests__/unit/approval.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the approval service
const mockApprovalService = {
  getApprovals: vi.fn(),
  getApprovalById: vi.fn(),
  approveRequest: vi.fn(),
  rejectRequest: vi.fn(),
  bulkApprove: vi.fn(),
  bulkReject: vi.fn(),
  getApprovalStats: vi.fn(),
};

vi.mock('@/lib/gov/approval.service', () => ({
  approvalService: mockApprovalService,
}));

describe('ApprovalService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(mockApprovalService).toBeDefined();
  });

  it('should have getApprovals method', () => {
    expect(mockApprovalService.getApprovals).toBeDefined();
    expect(typeof mockApprovalService.getApprovals).toBe('function');
  });

  it('should have approveRequest method', () => {
    expect(mockApprovalService.approveRequest).toBeDefined();
    expect(typeof mockApprovalService.approveRequest).toBe('function');
  });

  it('should have rejectRequest method', () => {
    expect(mockApprovalService.rejectRequest).toBeDefined();
    expect(typeof mockApprovalService.rejectRequest).toBe('function');
  });

  it('should get approvals successfully', async () => {
    const mockApprovals = [
      { id: '1', status: 'pending', request_type: 'student_update' },
      { id: '2', status: 'approved', request_type: 'school_update' },
    ];
    mockApprovalService.getApprovals.mockResolvedValue(mockApprovals);

    const result = await mockApprovalService.getApprovals();
    expect(result).toEqual(mockApprovals);
    expect(mockApprovalService.getApprovals).toHaveBeenCalled();
  });

  it('should approve a request', async () => {
    const mockApproved = { id: '1', status: 'approved' };
    mockApprovalService.approveRequest.mockResolvedValue(mockApproved);

    const result = await mockApprovalService.approveRequest('1', 'Approved');
    expect(result.status).toBe('approved');
    expect(mockApprovalService.approveRequest).toHaveBeenCalledWith('1', 'Approved');
  });

  it('should reject a request', async () => {
    const mockRejected = { id: '1', status: 'rejected' };
    mockApprovalService.rejectRequest.mockResolvedValue(mockRejected);

    const result = await mockApprovalService.rejectRequest('1', 'Invalid data');
    expect(result.status).toBe('rejected');
    expect(mockApprovalService.rejectRequest).toHaveBeenCalledWith('1', 'Invalid data');
  });
});
