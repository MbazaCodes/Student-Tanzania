// src/types/gov/student.ts

export interface GovStudent {
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
  updated_at?: string;
}

export interface StudentFilters {
  search?: string;
  region?: string;
  district?: string;
  school?: string;
  status?: 'active' | 'inactive' | 'suspended';
  level?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface StudentStats {
  total: number;
  active: number;
  inactive: number;
  byRegion: Record<string, number>;
  byLevel: Record<string, number>;
  newThisMonth: number;
}
