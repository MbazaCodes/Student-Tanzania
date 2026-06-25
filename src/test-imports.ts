// Test imports for government components
// This file verifies all imports work correctly

// Shared Components
import { KPICard, StatsGrid, FilterBar, DataTable, StatusBadge } from '@/components/gov/shared';

// Dashboard Components
import { KPIGrid, ActivityFeed, StatsOverview, DashboardHeader } from '@/components/gov/dashboard';

// Student Components
import { StudentTable, StudentFilters, StudentDetail, StudentStats } from '@/components/gov/students';

// School Components
import { SchoolTable, SchoolFilters, SchoolRegistration, SchoolStats } from '@/components/gov/schools';

// Admin Components
import { AdminTable, AdminForm, AdminStats } from '@/components/gov/admins';

// Approval Components
import { ApprovalTable, ApprovalDetail, ApprovalActions, ApprovalStats } from '@/components/gov/approvals';

// Analytics Components
import { AnalyticsDashboard, RegionalChart, TrendChart, DistributionChart } from '@/components/gov/analytics';

// Reports Components
import { ReportGenerator, ReportList, ReportExport } from '@/components/gov/reports';

// Settings Components
import { GovSettings, NotificationSettings } from '@/components/gov/settings';

// Hooks
import { useGovStudents, useGovSchools, useGovApprovals, useGovDashboard } from '@/hooks/gov';

// Services
import { studentService, schoolService, approvalService } from '@/lib/gov';

// Types
import type { GovStudent, GovSchool, GovAdmin, ApprovalRequest, DashboardStats } from '@/types/gov';

// Main export
import * as GovComponents from '@/components/gov';

console.log(' All imports are working!');
