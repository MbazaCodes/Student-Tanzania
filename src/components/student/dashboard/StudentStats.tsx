// src/components/student/dashboard/StudentStats.tsx
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, DollarSign, BarChart3, Clock, GraduationCap } from 'lucide-react';

interface StudentStatsProps {
  stats: {
    totalSubjects: number;
    totalFees: number;
    paidFees: number;
    averageGrade: string;
    attendance: number;
  };
}

export function StudentStats({ stats }: StudentStatsProps) {
  const items = [
    {
      label: 'Subjects',
      value: stats.totalSubjects,
      icon: BookOpen,
      color: 'bg-blue-500',
    },
    {
      label: 'Total Fees',
      value: `TZS ${stats.totalFees.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      label: 'Paid Fees',
      value: `TZS ${stats.paidFees.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-emerald-500',
    },
    {
      label: 'Average Grade',
      value: stats.averageGrade || '',
      icon: BarChart3,
      color: 'bg-purple-500',
    },
    {
      label: 'Attendance',
      value: `${stats.attendance}%`,
      icon: Clock,
      color: 'bg-amber-500',
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
