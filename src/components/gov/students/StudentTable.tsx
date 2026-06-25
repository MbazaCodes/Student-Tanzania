// src/components/gov/students/StudentTable.tsx

import { GovStudent } from '@/types/gov/student';
import { DataTable } from '../shared/DataTable';
import { StatusBadge } from '../shared/StatusBadge';
import { cn } from '@/lib/utils';

interface StudentTableProps {
  students: GovStudent[];
  onRowClick?: (student: GovStudent) => void;
  className?: string;
  emptyMessage?: string;
}

export function StudentTable({ 
  students, 
  onRowClick, 
  className,
  emptyMessage = 'No students found'
}: StudentTableProps) {
  const columns = [
    {
      key: 'photo',
      header: 'Photo',
      render: (student: GovStudent) => (
        student.photo ? (
          <img 
            src={student.photo} 
            className="w-9 h-12 object-cover rounded-md border" 
            alt={student.fullname}
          />
        ) : (
          <div className="w-9 h-12 rounded-md border bg-muted flex items-center justify-center text-lg">
            
          </div>
        )
      ),
      className: 'w-16'
    },
    {
      key: 'fullname',
      header: 'Student',
      render: (student: GovStudent) => (
        <div>
          <div className="font-semibold">{student.fullname}</div>
          <div className="text-xs font-mono text-muted-foreground">{student.tsid}</div>
          <div className="text-xs text-muted-foreground">
            {student.gender || ''}  {student.dob || ''}
          </div>
        </div>
      )
    },
    {
      key: 'school_name',
      header: 'School',
      render: (student: GovStudent) => (
        <div>
          <div className="text-sm font-medium">{student.school_name || ''}</div>
          <div className="text-xs font-mono text-muted-foreground">{student.school_code || ''}</div>
        </div>
      )
    },
    {
      key: 'region',
      header: 'Region',
      render: (student: GovStudent) => (
        <div className="text-sm text-muted-foreground">{student.region || ''}</div>
      )
    },
    {
      key: 'level',
      header: 'Level',
      render: (student: GovStudent) => (
        <div className="text-sm">{student.level || ''}</div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (student: GovStudent) => (
        <StatusBadge status={student.status} />
      )
    }
  ];

  return (
    <DataTable
      data={students}
      columns={columns}
      onRowClick={onRowClick}
      emptyMessage={emptyMessage}
      className={className}
    />
  );
}
