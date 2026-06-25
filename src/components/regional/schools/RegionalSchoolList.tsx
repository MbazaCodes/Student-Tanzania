// src/components/regional/schools/RegionalSchoolList.tsx
import { useState } from 'react';
import { DataTable } from '@/components/gov/shared/DataTable';
import { StatusBadge } from '@/components/gov/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, Eye, Download } from 'lucide-react';

interface School {
  id: string;
  name: string;
  code: string;
  district: string;
  type: string;
  studentCount: number;
  teacherCount: number;
  status: 'active' | 'suspended';
  registeredDate: string;
}

interface RegionalSchoolListProps {
  schools: School[];
  onView?: (school: School) => void;
  onExport?: () => void;
}

export function RegionalSchoolList({ schools, onView, onExport }: RegionalSchoolListProps) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredSchools = schools.filter(school => {
    const matchesSearch = school.name.toLowerCase().includes(search.toLowerCase()) ||
                          school.code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || school.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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
      key: 'district',
      header: 'District',
      render: (school: School) => (
        <span className="text-sm">{school.district}</span>
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
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search schools..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            className="rounded-md border bg-background px-3 py-2 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
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
        onRowClick={onView}
        emptyMessage="No schools found in this region"
      />
    </div>
  );
}
