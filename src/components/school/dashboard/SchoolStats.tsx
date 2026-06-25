// src/components/school/dashboard/SchoolStats.tsx
import { Users, GraduationCap, BookOpen, UserCheck } from 'lucide-react';
import { KPICard } from '@/components/gov/shared/KPICard';

interface SchoolStatsProps {
  stats: {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    activeStudents: number;
  };
}

export function SchoolStats({ stats }: SchoolStatsProps) {
  const items = [
    {
      label: 'Total Students',
      value: stats.totalStudents,
      icon: <Users className="h-4 w-4" />,
      color: 'var(--tz-navy)',
    },
    {
      label: 'Active Students',
      value: stats.activeStudents,
      icon: <UserCheck className="h-4 w-4" />,
      color: 'var(--tz-green)',
    },
    {
      label: 'Total Teachers',
      value: stats.totalTeachers,
      icon: <GraduationCap className="h-4 w-4" />,
      color: 'var(--tz-blue)',
    },
    {
      label: 'Total Classes',
      value: stats.totalClasses,
      icon: <BookOpen className="h-4 w-4" />,
      color: 'var(--tz-gold)',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item, index) => (
        <KPICard key={index} {...item} />
      ))}
    </div>
  );
}
