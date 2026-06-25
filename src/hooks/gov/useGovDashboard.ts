// src/hooks/gov/useGovDashboard.ts

import { useQuery } from '@tanstack/react-query';
import { studentService } from '@/lib/gov/student.service';
import { schoolService } from '@/lib/gov/school.service';
import { approvalService } from '@/lib/gov/approval.service';
import { DashboardStats } from '@/types/gov/analytics';

export function useGovDashboard() {
  const { data: studentStats, isLoading: studentsLoading } = useQuery({
    queryKey: ['gov-student-stats'],
    queryFn: () => studentService.getStudentStats(),
  });

  const { data: schoolStats, isLoading: schoolsLoading } = useQuery({
    queryKey: ['gov-school-stats'],
    queryFn: () => schoolService.getSchoolStats(),
  });

  const { data: approvalStats, isLoading: approvalsLoading } = useQuery({
    queryKey: ['gov-approval-stats'],
    queryFn: () => approvalService.getApprovalStats(),
  });

  const isLoading = studentsLoading || schoolsLoading || approvalsLoading;

  const dashboardStats: DashboardStats | null = studentStats && schoolStats && approvalStats
    ? {
        students: {
          total: studentStats.total,
          active: studentStats.active,
          newThisMonth: studentStats.newThisMonth,
          growthRate: 0, // TODO: Calculate from historical data
        },
        schools: {
          total: schoolStats.total,
          active: schoolStats.active,
          newThisMonth: 0, // TODO: Calculate
          byType: schoolStats.byType,
        },
        approvals: {
          pending: approvalStats.pending,
          approved: approvalStats.approved,
          rejected: approvalStats.rejected,
          avgResolutionTime: approvalStats.avgResolutionTime,
        },
        regions: [], // TODO: Fetch regional data
      }
    : null;

  return {
    stats: dashboardStats,
    isLoading,
    studentStats,
    schoolStats,
    approvalStats,
  };
}
