// src/types/gov/admin.ts

export interface GovAdmin {
  auth_uid: string;
  name: string;
  email: string;
  role: 'gov' | 'admin' | 'gov_region' | 'gov_district';
  region?: string;
  district?: string;
  status: 'active' | 'suspended';
  notes?: string;
  created_at?: string;
}

export interface AdminFilters {
  search?: string;
  role?: 'gov' | 'admin' | 'gov_region' | 'gov_district';
  region?: string;
  district?: string;
  status?: 'active' | 'suspended';
}

export interface AdminCreation {
  name: string;
  email: string;
  password: string;
  role: 'gov_region' | 'gov_district';
  region: string;
  district?: string;
}

export interface AdminStats {
  total: number;
  national: number;
  regional: number;
  district: number;
  active: number;
}
