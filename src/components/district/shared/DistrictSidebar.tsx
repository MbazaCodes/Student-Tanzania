// src/components/district/shared/DistrictSidebar.tsx
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

interface DistrictSidebarProps {
  district?: string;
  region?: string;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/district' },
  { icon: Building2, label: 'Schools', href: '/district/schools' },
  { icon: Users, label: 'Students', href: '/district/students' },
  { icon: FileText, label: 'Reports', href: '/district/reports' },
  { icon: Settings, label: 'Settings', href: '/district/settings' },
];

export function DistrictSidebar({ district, region }: DistrictSidebarProps) {
  const router = useRouter();
  const currentPath = router.state.location.pathname;

  return (
    <aside className="w-64 bg-white border-r flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center gap-2">
          <MapPin className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">District</span>
        </div>
        {district && (
          <div className="mt-1 text-sm text-muted-foreground">{district} District</div>
        )}
        {region && (
          <div className="text-xs text-muted-foreground">{region} Region</div>
        )}
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = currentPath === item.href || 
                          (item.href !== '/district' && currentPath.startsWith(item.href));
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
          <div>Role: District Administrator</div>
        </div>
      </div>
    </aside>
  );
}
