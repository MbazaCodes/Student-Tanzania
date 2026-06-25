// src/components/school/classes/ClassList.tsx
import { useState } from 'react';
import { DataTable } from '@/components/gov/shared/DataTable';
import { StatusBadge } from '@/components/gov/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Plus, Users, User } from 'lucide-react';

interface Class {
  id: string;
  name: string;
  level: string;
  teacher: string;
  studentCount: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

interface ClassListProps {
  classes: Class[];
  onAdd?: () => void;
  onClassClick?: (classItem: Class) => void;
}

export function ClassList({ classes, onAdd, onClassClick }: ClassListProps) {
  const columns = [
    {
      key: 'name',
      header: 'Class',
      render: (classItem: Class) => (
        <div>
          <div className="font-semibold">{classItem.name}</div>
          <div className="text-xs text-muted-foreground">{classItem.level}</div>
        </div>
      ),
    },
    {
      key: 'teacher',
      header: 'Teacher',
      render: (classItem: Class) => (
        <div className="flex items-center gap-1">
          <User className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{classItem.teacher}</span>
        </div>
      ),
    },
    {
      key: 'studentCount',
      header: 'Students',
      render: (classItem: Class) => (
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm font-medium">{classItem.studentCount}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (classItem: Class) => (
        <StatusBadge status={classItem.status} />
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (classItem: Class) => (
        <div className="text-xs text-muted-foreground">
          {new Date(classItem.createdAt).toLocaleDateString()}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Classes</h2>
          <p className="text-sm text-muted-foreground">
            {classes.length} classes total
          </p>
        </div>
        <Button onClick={onAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Create Class
        </Button>
      </div>

      <DataTable
        data={classes}
        columns={columns}
        onRowClick={onClassClick}
        emptyMessage="No classes found"
      />
    </div>
  );
}
