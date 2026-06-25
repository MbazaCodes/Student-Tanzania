// src/components/regional/students/RegionalStudentStats.tsx
import { Card, CardContent } from '@/components/ui/card';
import { Users, UserCheck, UserX, TrendingUp, School } from 'lucide-react';

interface RegionalStudentStatsProps {
  stats: {
    totalStudents: number;
    activeStudents: number;
    inactiveStudents: number;
    newThisMonth: number;
    schoolsWithStudents: number;
  };
}

export function RegionalStudentStats({ stats }: RegionalStudentStatsProps) {
  const items = [
    {
      label: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      label: 'Active Students',
      value: stats.activeStudents,
      icon: UserCheck,
      color: 'bg-green-500',
    },
    {
      label: 'Inactive Students',
      value: stats.inactiveStudents,
      icon: UserX,
      color: 'bg-amber-500',
    },
    {
      label: 'New This Month',
      value: stats.newThisMonth,
      icon: TrendingUp,
      color: 'bg-emerald-500',
    },
    {
      label: 'Schools',
      value: stats.schoolsWithStudents,
      icon: School,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
