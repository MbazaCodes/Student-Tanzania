// src/types/gov/school.ts

export interface GovSchool {
  school_code: string;
  school_name: string;
  type: string;
  region: string;
  district: string;
  ward: string;
  address?: string;
  phone?: string;
  email?: string;
  status: 'active' | 'suspended';
  cred_username?: string;
  auth_uid?: string;
  notes?: string;
  created_at?: string;
}

export interface SchoolFilters {
  search?: string;
  region?: string;
  district?: string;
  type?: string;
  status?: 'active' | 'suspended';
}

export interface SchoolRegistration {
  school_name: string;
  type: string;
  region: string;
  district: string;
  ward: string;
  address?: string;
  phone?: string;
  email: string;
  password: string;
  school_code?: string;
}

export interface SchoolStats {
  total: number;
  active: number;
  suspended: number;
  byType: Record<string, number>;
  byRegion: Record<string, number>;
}
