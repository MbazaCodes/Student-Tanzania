// src/components/regional/students/RegionalStudentList.tsx
import { useState } from 'react';
import { StudentTable } from '@/components/gov/students/StudentTable';
import { StudentDetail } from '@/components/gov/students/StudentDetail';
import { StudentFilters } from '@/components/gov/students/StudentFilters';
import { Button } from '@/components/ui/button';
import { Download, Filter } from 'lucide-react';

interface Student {
  tsid: string;
  fullname: string;
  dob?: string;
  gender?: string;
  photo?: string;
  status: 'active' | 'inactive' | 'suspended';
  level?: string;
  region?: string;
  district?: string;
  school_code?: string;
  school_name?: string;
  created_at: string;
}

interface RegionalStudentListProps {
  students: Student[];
  onExport?: () => void;
  region?: string;
}

export function RegionalStudentList({ students, onExport, region }: RegionalStudentListProps) {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [filters, setFilters] = useState({});

  const handleRowClick = (student: Student) => {
    setSelectedStudent(student);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <StudentFilters
            filters={filters}
            onFilterChange={setFilters}
          />
        </div>
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        )}
      </div>

      <StudentTable
        students={students}
        onRowClick={handleRowClick}
      />

      {selectedStudent && (
        <StudentDetail
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}
