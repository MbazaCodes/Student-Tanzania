// src/components/school/students/StudentList.tsx
import { useState } from 'react';
import { StudentTable } from '@/components/gov/students/StudentTable';
import { StudentDetail } from '@/components/gov/students/StudentDetail';
import { StudentFilters } from '@/components/gov/students/StudentFilters';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

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

interface StudentListProps {
  students: Student[];
  onRegister?: () => void;
  onStudentClick?: (student: Student) => void;
}

export function StudentList({ students, onRegister, onStudentClick }: StudentListProps) {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [filters, setFilters] = useState({});

  const handleRowClick = (student: Student) => {
    setSelectedStudent(student);
    onStudentClick?.(student);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <StudentFilters
            filters={filters}
            onFilterChange={setFilters}
          />
        </div>
        <Button onClick={onRegister}>
          <Plus className="h-4 w-4 mr-2" />
          Register Student
        </Button>
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
