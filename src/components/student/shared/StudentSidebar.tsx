// src/components/student/shared/StudentSidebar.tsx
import { Link, useRouter } from '@tanstack/react-router';
import { 
  LayoutDashboard, 
  User, 
  BookOpen, 
  DollarSign, 
  Calendar, 
  BarChart3, 
  Clock,
  GraduationCap,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/student' },
  { icon: User, label: 'Profile', href: '/student/profile' },
  { icon: BookOpen, label: 'Academics', href: '/student/academics' },
  { icon: DollarSign, label: 'Fees', href: '/student/fees' },
  { icon: Calendar, label: 'Timetable', href: '/student/timetable' },
  { icon: BarChart3, label: 'Results', href: '/student/results' },
  { icon: Clock, label: 'Attendance', href: '/student/attendance' },
];

export function StudentSidebar() {
  const router = useRouter();
  const currentPath = router.state.location.pathname;

  return (
    <aside className="w-64 bg-white border-r flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">Student Portal</span>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          <div>Welcome back!</div>
          <div className="font-medium text-primary">John Doe</div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = currentPath === item.href || 
                          (item.href !== '/student' && currentPath.startsWith(item.href));
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors',
                isActive 
                  ? 'bg-primary/10 text-primary font-medium' 
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Bell className="h-3.5 w-3.5" />
          <span>2 notifications</span>
        </div>
      </div>
    </aside>
  );
}
