// src/components/school/teachers/TeacherList.tsx
import { useState } from 'react';
import { DataTable } from '@/components/gov/shared/DataTable';
import { StatusBadge } from '@/components/gov/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Plus, Mail, Phone } from 'lucide-react';

interface Teacher {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  status: 'active' | 'inactive';
  joinedAt: string;
}

interface TeacherListProps {
  teachers: Teacher[];
  onAdd?: () => void;
  onTeacherClick?: (teacher: Teacher) => void;
}

export function TeacherList({ teachers, onAdd, onTeacherClick }: TeacherListProps) {
  const columns = [
    {
      key: 'name',
      header: 'Teacher',
      render: (teacher: Teacher) => (
        <div>
          <div className="font-semibold">{teacher.name}</div>
          <div className="text-xs text-muted-foreground">{teacher.subject}</div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Contact',
      render: (teacher: Teacher) => (
        <div>
          <div className="flex items-center gap-1 text-sm">
            <Mail className="h-3 w-3" />
            {teacher.email}
          </div>
          {teacher.phone && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
              {teacher.phone}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (teacher: Teacher) => (
        <span className="text-sm">{teacher.subject}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (teacher: Teacher) => (
        <StatusBadge status={teacher.status} />
      ),
    },
    {
      key: 'joinedAt',
      header: 'Joined',
      render: (teacher: Teacher) => (
        <div className="text-xs text-muted-foreground">
          {new Date(teacher.joinedAt).toLocaleDateString()}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Teachers</h2>
          <p className="text-sm text-muted-foreground">
            {teachers.length} teachers total
          </p>
        </div>
        <Button onClick={onAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Teacher
        </Button>
      </div>

      <DataTable
        data={teachers}
        columns={columns}
        onRowClick={onTeacherClick}
        emptyMessage="No teachers found"
      />
    </div>
  );
}
