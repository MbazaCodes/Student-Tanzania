// src/components/district/schools/DistrictSchoolList.tsx
import { useState } from 'react';
import { DataTable } from '@/components/gov/shared/DataTable';
import { StatusBadge } from '@/components/gov/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Eye, Download } from 'lucide-react';

interface School {
  id: string;
  name: string;
  code: string;
  type: string;
  studentCount: number;
  teacherCount: number;
  status: 'active' | 'suspended';
  registeredDate: string;
}

interface DistrictSchoolListProps {
  schools: School[];
  onView?: (school: School) => void;
  onExport?: () => void;
}

export function DistrictSchoolList({ schools, onView, onExport }: DistrictSchoolListProps) {
  const [search, setSearch] = useState('');

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(search.toLowerCase()) ||
    school.code.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      key: 'name',
      header: 'School',
      render: (school: School) => (
        <div>
          <div className="font-semibold">{school.name}</div>
          <div className="text-xs text-muted-foreground font-mono">{school.code}</div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (school: School) => (
        <span className="text-sm">{school.type}</span>
      ),
    },
    {
      key: 'studentCount',
      header: 'Students',
      render: (school: School) => (
        <span className="font-mono">{school.studentCount}</span>
      ),
    },
    {
      key: 'teacherCount',
      header: 'Teachers',
      render: (school: School) => (
        <span className="font-mono">{school.teacherCount}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (school: School) => (
        <StatusBadge status={school.status} />
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (school: School) => (
        <Button size="sm" variant="ghost" onClick={() => onView?.(school)}>
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search schools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        )}
      </div>

      <DataTable
        data={filteredSchools}
        columns={columns}
        emptyMessage="No schools found in this district"
      />
    </div>
  );
}
