// src/hooks/gov/useGovSchools.ts

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { schoolService } from '@/lib/gov/school.service';
import { GovSchool, SchoolFilters, SchoolRegistration } from '@/types/gov/school';
import { toast } from 'sonner';

export function useGovSchools(filters?: SchoolFilters) {
  const queryClient = useQueryClient();

  const { data: schools, isLoading, error } = useQuery({
    queryKey: ['gov-schools', filters],
    queryFn: () => schoolService.getSchools(filters),
  });

  const { data: stats } = useQuery({
    queryKey: ['gov-school-stats'],
    queryFn: () => schoolService.getSchoolStats(),
  });

  const registerSchool = useMutation({
    mutationFn: (data: SchoolRegistration) => schoolService.registerSchool(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gov-schools'] });
      queryClient.invalidateQueries({ queryKey: ['gov-school-stats'] });
      toast.success('School registered successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to register school');
    },
  });

  const updateSchool = useMutation({
    mutationFn: ({ code, data }: { code: string; data: Partial<GovSchool> }) =>
      schoolService.updateSchool(code, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gov-schools'] });
      queryClient.invalidateQueries({ queryKey: ['gov-school-stats'] });
      toast.success('School updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update school');
    },
  });

  const deleteSchool = useMutation({
    mutationFn: (code: string) => schoolService.deleteSchool(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gov-schools'] });
      queryClient.invalidateQueries({ queryKey: ['gov-school-stats'] });
      toast.success('School deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete school');
    },
  });

  const toggleStatus = useMutation({
    mutationFn: (code: string) => schoolService.toggleSchoolStatus(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gov-schools'] });
      queryClient.invalidateQueries({ queryKey: ['gov-school-stats'] });
      toast.success('School status updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update school status');
    },
  });

  const resetPassword = useMutation({
    mutationFn: ({ code, password }: { code: string; password: string }) =>
      schoolService.resetSchoolPassword(code, password),
    onSuccess: () => {
      toast.success('School password reset successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reset password');
    },
  });

  return {
    schools: schools || [],
    isLoading,
    error,
    stats,
    registerSchool: registerSchool.mutate,
    isRegistering: registerSchool.isPending,
    updateSchool: updateSchool.mutate,
    isUpdating: updateSchool.isPending,
    deleteSchool: deleteSchool.mutate,
    isDeleting: deleteSchool.isPending,
    toggleStatus: toggleStatus.mutate,
    isToggling: toggleStatus.isPending,
    resetPassword: resetPassword.mutate,
    isResetting: resetPassword.isPending,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['gov-schools'] }),
  };
}
