// src/components/regional/shared/RegionalSidebar.tsx
import { Link, useRouter } from '@tanstack/react-router';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  FileText, 
  Settings,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RegionalSidebarProps {
  region?: string;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/regional' },
  { icon: Building2, label: 'Schools', href: '/regional/schools' },
  { icon: Users, label: 'Students', href: '/regional/students' },
  { icon: FileText, label: 'Reports', href: '/regional/reports' },
  { icon: Settings, label: 'Settings', href: '/regional/settings' },
];

export function RegionalSidebar({ region }: RegionalSidebarProps) {
  const router = useRouter();
  const currentPath = router.state.location.pathname;

  return (
    <aside className="w-64 bg-white border-r flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center gap-2">
          <MapPin className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">Regional</span>
        </div>
        {region && (
          <div className="mt-1 text-sm text-muted-foreground">{region}</div>
        )}
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = currentPath === item.href || 
                          (item.href !== '/regional' && currentPath.startsWith(item.href));
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
        <div className="text-xs text-muted-foreground">
          <div>Role: Regional Administrator</div>
        </div>
      </div>
    </aside>
  );
}
