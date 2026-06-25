// src/types/gov/analytics.ts

export interface DashboardStats {
  students: {
    total: number;
    active: number;
    newThisMonth: number;
    growthRate: number;
  };
  schools: {
    total: number;
    active: number;
    newThisMonth: number;
    byType: Record<string, number>;
  };
  approvals: {
    pending: number;
    approved: number;
    rejected: number;
    avgResolutionTime: number;
  };
  regions: RegionStats[];
}

export interface RegionStats {
  region: string;
  studentCount: number;
  schoolCount: number;
  activeStudents: number;
  approvalRate: number;
}

export interface TrendData {
  date: string;
  students: number;
  schools: number;
  approvals: number;
}

export interface SchoolTypeDistribution {
  type: string;
  count: number;
  percentage: number;
}

export interface RegionalDistribution {
  region: string;
  students: number;
  schools: number;
}

export interface AnalyticsFilters {
  region?: string;
  dateFrom?: string;
  dateTo?: string;
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}
