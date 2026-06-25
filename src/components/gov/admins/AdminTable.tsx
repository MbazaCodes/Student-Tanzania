// src/components/gov/admins/AdminTable.tsx

import { GovAdmin } from '@/types/gov/admin';
import { DataTable } from '../shared/DataTable';
import { StatusBadge } from '../shared/StatusBadge';
import { Crown, MapPin, Building2, Shield } from 'lucide-react';

interface AdminTableProps {
  admins: GovAdmin[];
  onRowClick?: (admin: GovAdmin) => void;
  className?: string;
  emptyMessage?: string;
}

const ROLE_ICONS: Record<string, { icon: typeof Crown; color: string; label: string }> = {
  gov: { icon: Crown, color: '#1EB53A', label: 'National' },
  admin: { icon: Crown, color: '#1EB53A', label: 'National' },
  gov_region: { icon: MapPin, color: '#F5C400', label: 'Regional' },
  gov_district: { icon: Building2, color: '#007AFF', label: 'District' },
};

export function AdminTable({ 
  admins, 
  onRowClick, 
  className,
  emptyMessage = 'No administrators found'
}: AdminTableProps) {
  const columns = [
    {
      key: 'name',
      header: 'Admin',
      render: (admin: GovAdmin) => {
        const roleMeta = ROLE_ICONS[admin.role] || ROLE_ICONS.gov_district;
        const RoleIcon = roleMeta.icon;
        return (
          <div>
            <div className="flex items-center gap-2">
              <RoleIcon className="h-3.5 w-3.5" style={{ color: roleMeta.color }} />
              <span className="font-semibold">{admin.name}</span>
            </div>
            {admin.notes && (
              <div className="text-[11px] text-muted-foreground mt-1 flex items-start gap-1">
                <span></span> {admin.notes}
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'email',
      header: 'Email',
      render: (admin: GovAdmin) => (
        <div className="text-sm text-muted-foreground">{admin.email}</div>
      )
    },
    {
      key: 'role',
      header: 'Role',
      render: (admin: GovAdmin) => {
        const roleMeta = ROLE_ICONS[admin.role] || ROLE_ICONS.gov_district;
        return (
          <div className="text-sm">
            <span className="font-medium">{roleMeta.label}</span>
            {admin.region && (
              <div className="text-xs text-muted-foreground">
                {admin.district ? ${admin.district},  : admin.region}
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (admin: GovAdmin) => (
        <StatusBadge status={admin.status} />
      )
    }
  ];

  return (
    <DataTable
      data={admins}
      columns={columns}
      onRowClick={onRowClick}
      emptyMessage={emptyMessage}
      className={className}
    />
  );
}
