// src/components/regional/dashboard/RegionalStats.tsx
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Users, School, FileCheck2, TrendingUp, Clock } from 'lucide-react';

interface RegionalStatsProps {
  stats: {
    totalSchools: number;
    totalStudents: number;
    activeSchools: number;
    pendingApprovals: number;
    studentsGrowth: number;
    avgAttendance: number;
  };
}

export function RegionalStats({ stats }: RegionalStatsProps) {
  const items = [
    {
      label: 'Total Schools',
      value: stats.totalSchools,
      icon: Building2,
      color: 'bg-blue-500',
    },
    {
      label: 'Active Schools',
      value: stats.activeSchools,
      icon: School,
      color: 'bg-green-500',
    },
    {
      label: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'bg-purple-500',
    },
    {
      label: 'Pending Approvals',
      value: stats.pendingApprovals,
      icon: FileCheck2,
      color: 'bg-amber-500',
    },
    {
      label: 'Student Growth',
      value: `${stats.studentsGrowth}%`,
      icon: TrendingUp,
      color: 'bg-emerald-500',
    },
    {
      label: 'Avg Attendance',
      value: `${stats.avgAttendance}%`,
      icon: Clock,
      color: 'bg-indigo-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${item.color}`}>
                <item.icon className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold">{item.value}</div>
                <div className="text-xs text-muted-foreground">{item.label}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
