// src/hooks/gov/useGovStudents.ts

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { studentService } from '@/lib/gov/student.service';
import { GovStudent, StudentFilters } from '@/types/gov/student';
import { toast } from 'sonner';

export function useGovStudents(filters?: StudentFilters) {
  const queryClient = useQueryClient();

  const { data: students, isLoading, error } = useQuery({
    queryKey: ['gov-students', filters],
    queryFn: () => studentService.getStudents(filters),
  });

  const { data: stats } = useQuery({
    queryKey: ['gov-student-stats'],
    queryFn: () => studentService.getStudentStats(),
  });

  const updateStudent = useMutation({
    mutationFn: ({ tsid, data }: { tsid: string; data: Partial<GovStudent> }) =>
      studentService.updateStudent(tsid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gov-students'] });
      queryClient.invalidateQueries({ queryKey: ['gov-student-stats'] });
      toast.success('Student updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update student');
    },
  });

  const deleteStudent = useMutation({
    mutationFn: (tsid: string) => studentService.deleteStudent(tsid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gov-students'] });
      queryClient.invalidateQueries({ queryKey: ['gov-student-stats'] });
      toast.success('Student deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete student');
    },
  });

  const getStudent = useQuery({
    queryKey: ['gov-student-detail'],
    queryFn: () => studentService.getStudentByTsid,
    enabled: false,
  });

  return {
    students: students || [],
    isLoading,
    error,
    stats,
    updateStudent: updateStudent.mutate,
    isUpdating: updateStudent.isPending,
    deleteStudent: deleteStudent.mutate,
    isDeleting: deleteStudent.isPending,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['gov-students'] }),
  };
}
