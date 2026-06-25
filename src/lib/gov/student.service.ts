// src/lib/gov/student.service.ts
import { BaseService } from './base.service';
import { GovStudent, StudentFilters, StudentStats } from '@/types/gov/student';

export class StudentService extends BaseService {
  async getStudents(filters?: StudentFilters): Promise<GovStudent[]> {
    let query = this.supabase
      .from('students')
      .select('*');

    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      query = query.or(`fullname.ilike.${searchTerm},tsid.ilike.${searchTerm}`);
    }

    if (filters?.region) {
      query = query.eq('region', filters.region);
    }

    if (filters?.district) {
      query = query.eq('district', filters.district);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.school) {
      query = query.eq('school_code', filters.school);
    }

    if (filters?.level) {
      query = query.eq('level', filters.level);
    }

    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    query = query.order('created_at', { ascending: false });

    return this.withErrorHandlingArray(() => query);
  }

  async getStudentByTsid(tsid: string): Promise<GovStudent> {
    return this.withErrorHandling(() =>
      this.supabase
        .from('students')
        .select('*')
        .eq('tsid', tsid)
        .single()
    );
  }

  async getStudentStats(): Promise<StudentStats> {
    const { data: students } = await this.supabase
      .from('students')
      .select('status, region, level');

    const total = students?.length || 0;
    const active = students?.filter(s => s.status === 'active').length || 0;
    const inactive = students?.filter(s => s.status !== 'active').length || 0;

    const byRegion: Record<string, number> = {};
    const byLevel: Record<string, number> = {};

    students?.forEach(s => {
      if (s.region) byRegion[s.region] = (byRegion[s.region] || 0) + 1;
      if (s.level) byLevel[s.level] = (byLevel[s.level] || 0) + 1;
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newThisMonth = students?.filter(s => 
      s.created_at && new Date(s.created_at) >= startOfMonth
    ).length || 0;

    return {
      total,
      active,
      inactive,
      byRegion,
      byLevel,
      newThisMonth,
    };
  }

  async updateStudent(tsid: string, data: Partial<GovStudent>): Promise<GovStudent> {
    return this.withErrorHandling(() =>
      this.supabase
        .from('students')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('tsid', tsid)
        .select()
        .single()
    );
  }

  async deleteStudent(tsid: string): Promise<void> {
    await this.withErrorHandling(() =>
      this.supabase
        .from('students')
        .delete()
        .eq('tsid', tsid)
    );
  }

  async getStudentsBySchool(schoolCode: string): Promise<GovStudent[]> {
    return this.withErrorHandlingArray(() =>
      this.supabase
        .from('students')
        .select('*')
        .eq('school_code', schoolCode)
        .order('fullname')
    );
  }

  async getStudentsByRegion(region: string): Promise<GovStudent[]> {
    return this.withErrorHandlingArray(() =>
      this.supabase
        .from('students')
        .select('*')
        .eq('region', region)
        .order('fullname')
    );
  }

  async createStudent(data: Partial<GovStudent>): Promise<GovStudent> {
    return this.withErrorHandling(() =>
      this.supabase
        .from('students')
        .insert(data)
        .select()
        .single()
    );
  }
}

export const studentService = new StudentService();
