// src/components/student/dashboard/QuickLinks.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@tanstack/react-router';
import { 
  BookOpen, 
  DollarSign, 
  Calendar, 
  BarChart3, 
  Clock,
  ArrowRight
} from 'lucide-react';

const links = [
  { label: 'View Academics', href: '/student/academics', icon: BookOpen },
  { label: 'Check Fees', href: '/student/fees', icon: DollarSign },
  { label: 'View Timetable', href: '/student/timetable', icon: Calendar },
  { label: 'Results', href: '/student/results', icon: BarChart3 },
  { label: 'Attendance', href: '/student/attendance', icon: Clock },
];

export function QuickLinks() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Quick Links</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <link.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{link.label}</span>
              </div>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
