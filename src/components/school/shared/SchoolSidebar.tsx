// src/components/school/shared/SchoolSidebar.tsx
import { Link, useRouter } from '@tanstack/react-router';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  FileText, 
  Settings,
  School,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/school' },
  { icon: Users, label: 'Students', href: '/school/students' },
  { icon: GraduationCap, label: 'Teachers', href: '/school/teachers' },
  { icon: BookOpen, label: 'Classes', href: '/school/classes' },
  { icon: FileText, label: 'Reports', href: '/school/reports' },
  { icon: DollarSign, label: 'Fees', href: '/school/fees' },
  { icon: Settings, label: 'Settings', href: '/school/settings' },
];

export function SchoolSidebar() {
  const router = useRouter();
  const currentPath = router.state.location.pathname;

  return (
    <aside className="w-64 bg-white border-r flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center gap-2">
          <School className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">School Portal</span>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = currentPath === item.href || 
                          (item.href !== '/school' && currentPath.startsWith(item.href));
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
        <div className="text-xs text-gray-500">
          <div>School Code: SC001</div>
          <div className="mt-1">Role: Administrator</div>
        </div>
      </div>
    </aside>
  );
}
