// src/lib/gov/school.service.ts
import { BaseService } from './base.service';
import { GovSchool, SchoolFilters, SchoolStats, SchoolRegistration } from '@/types/gov/school';

export class SchoolService extends BaseService {
  async getSchools(filters?: SchoolFilters): Promise<GovSchool[]> {
    let query = this.supabase
      .from('schools')
      .select('*');

    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      query = query.or(`school_name.ilike.${searchTerm},school_code.ilike.${searchTerm}`);
    }

    if (filters?.region) {
      query = query.eq('region', filters.region);
    }

    if (filters?.district) {
      query = query.eq('district', filters.district);
    }

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    query = query.order('school_name');

    return this.withErrorHandlingArray(() => query);
  }

  async getSchoolByCode(code: string): Promise<GovSchool> {
    return this.withErrorHandling(() =>
      this.supabase
        .from('schools')
        .select('*')
        .eq('school_code', code)
        .single()
    );
  }

  async registerSchool(data: SchoolRegistration): Promise<GovSchool> {
    const { data: result, error } = await this.supabase.functions.invoke('create-school', {
      body: data,
    });

    if (error) throw new Error(error.message);
    if (result?.error) throw new Error(result.error);

    return result;
  }

  async updateSchool(code: string, data: Partial<GovSchool>): Promise<GovSchool> {
    return this.withErrorHandling(() =>
      this.supabase
        .from('schools')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('school_code', code)
        .select()
        .single()
    );
  }

  async deleteSchool(code: string): Promise<void> {
    await this.withErrorHandling(() =>
      this.supabase
        .from('schools')
        .delete()
        .eq('school_code', code)
    );
  }

  async toggleSchoolStatus(code: string): Promise<GovSchool> {
    const school = await this.getSchoolByCode(code);
    const newStatus = school.status === 'active' ? 'suspended' : 'active';
    return this.updateSchool(code, { status: newStatus });
  }

  async getSchoolStats(): Promise<SchoolStats> {
    const { data: schools } = await this.supabase
      .from('schools')
      .select('status, type, region');

    const total = schools?.length || 0;
    const active = schools?.filter(s => s.status === 'active').length || 0;
    const suspended = schools?.filter(s => s.status !== 'active').length || 0;

    const byType: Record<string, number> = {};
    const byRegion: Record<string, number> = {};

    schools?.forEach(s => {
      if (s.type) byType[s.type] = (byType[s.type] || 0) + 1;
      if (s.region) byRegion[s.region] = (byRegion[s.region] || 0) + 1;
    });

    return {
      total,
      active,
      suspended,
      byType,
      byRegion,
    };
  }

  async getSchoolsByRegion(region: string): Promise<GovSchool[]> {
    return this.withErrorHandlingArray(() =>
      this.supabase
        .from('schools')
        .select('*')
        .eq('region', region)
        .order('school_name')
    );
  }

  async resetSchoolPassword(code: string, newPassword: string): Promise<void> {
    const { data, error } = await this.supabase.functions.invoke('manage-admin', {
      body: {
        action: 'reset_school_password',
        school_code: code,
        new_password: newPassword,
      },
    });

    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
  }
}

export const schoolService = new SchoolService();
