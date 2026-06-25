// src/components/gov/schools/SchoolTable.tsx

import { GovSchool } from '@/types/gov/school';
import { DataTable } from '../shared/DataTable';
import { StatusBadge } from '../shared/StatusBadge';
import { Building2, MapPin, Mail, Phone } from 'lucide-react';

interface SchoolTableProps {
  schools: GovSchool[];
  onRowClick?: (school: GovSchool) => void;
  className?: string;
  emptyMessage?: string;
}

export function SchoolTable({ 
  schools, 
  onRowClick, 
  className,
  emptyMessage = 'No schools found'
}: SchoolTableProps) {
  const columns = [
    {
      key: 'school_code',
      header: 'Code',
      render: (school: GovSchool) => (
        <div className="font-mono text-xs text-primary font-bold">
          {school.school_code}
        </div>
      ),
      className: 'w-24'
    },
    {
      key: 'school_name',
      header: 'School',
      render: (school: GovSchool) => (
        <div>
          <div className="font-semibold">{school.school_name}</div>
          <div className="text-xs text-muted-foreground">{school.type}</div>
          {school.notes && (
            <div className="text-[11px] text-muted-foreground mt-1 flex items-start gap-1">
              <span className="text-xs"></span>
              {school.notes}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'region',
      header: 'Location',
      render: (school: GovSchool) => (
        <div>
          <div className="text-sm">{school.region}</div>
          <div className="text-xs text-muted-foreground">
            {school.district}  {school.ward}
          </div>
        </div>
      )
    },
    {
      key: 'cred_username',
      header: 'Login',
      render: (school: GovSchool) => (
        <div className="font-mono text-xs">
          {school.cred_username || ''}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (school: GovSchool) => (
        <StatusBadge status={school.status} />
      )
    }
  ];

  return (
    <DataTable
      data={schools}
      columns={columns}
      onRowClick={onRowClick}
      emptyMessage={emptyMessage}
      className={className}
    />
  );
}
