// src/components/gov/analytics/AnalyticsDashboard.tsx

import { DashboardStats } from '@/types/gov/analytics';
import { StatsOverview } from '../dashboard/StatsOverview';
import { KPIGrid } from '../dashboard/KPIGrid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Building2, Clock } from 'lucide-react';

interface AnalyticsDashboardProps {
  stats: DashboardStats | null;
  isLoading?: boolean;
  className?: string;
}

export function AnalyticsDashboard({ stats, isLoading, className }: AnalyticsDashboardProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border bg-card p-5 animate-pulse">
              <div className="h-9 w-9 rounded-lg bg-muted" />
              <div className="mt-3 h-8 w-20 bg-muted rounded" />
              <div className="mt-1 h-4 w-24 bg-muted rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl border bg-card p-6 animate-pulse h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  const kpiItems = [
    {
      label: 'Total Students',
      value: stats.students.total,
      icon: <Users className="h-4 w-4" />,
      color: 'var(--tz-navy)',
      trend: stats.students.growthRate > 0 ? {
        value: stats.students.growthRate,
        direction: 'up' as const
      } : undefined
    },
    {
      label: 'Active Students',
      value: stats.students.active,
      icon: <Users className="h-4 w-4" />,
      color: 'var(--tz-green)',
    },
    {
      label: 'Total Schools',
      value: stats.schools.total,
      icon: <Building2 className="h-4 w-4" />,
      color: 'var(--tz-blue)',
    },
    {
      label: 'Pending Approvals',
      value: stats.approvals.pending,
      icon: <Clock className="h-4 w-4" />,
      color: 'var(--tz-gold)',
    },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Overview Stats */}
      <StatsOverview stats={stats} />

      {/* KPI Grid */}
      <KPIGrid items={kpiItems} columns={4} />

      {/* Regional Distribution Section */}
      {stats.regions && stats.regions.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Regional Distribution</CardTitle>
              <CardDescription>Students by region</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.regions.slice(0, 10).map((region) => (
                  <div key={region.region} className="flex items-center gap-3">
                    <span className="text-sm w-32 truncate">{region.region}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ 
                          width: ${Math.min((region.studentCount / stats.students.total) * 100, 100)}% 
                        }}
                      />
                    </div>
                    <span className="text-sm font-mono">{region.studentCount}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>School Distribution</CardTitle>
              <CardDescription>Schools by type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.schools.byType).slice(0, 10).map(([type, count]) => (
                  <div key={type} className="flex items-center gap-3">
                    <span className="text-sm w-32 truncate">{type}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ 
                          width: ${Math.min((count / stats.schools.total) * 100, 100)}% 
                        }}
                      />
                    </div>
                    <span className="text-sm font-mono">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Approval Metrics */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approval Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.approvals.total > 0 
                ? ${Math.round((stats.approvals.approved / stats.approvals.total) * 100)}%
                : ''}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.approvals.approved} approved out of {stats.approvals.total} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rejection Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.approvals.total > 0 
                ? ${Math.round((stats.approvals.rejected / stats.approvals.total) * 100)}%
                : ''}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.approvals.rejected} rejected out of {stats.approvals.total} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Resolution Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.approvals.avgResolutionTime > 0 
                ? ${Math.round(stats.approvals.avgResolutionTime)}h
                : ''}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Average time to resolve requests
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
