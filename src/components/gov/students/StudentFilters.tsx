// src/components/gov/students/StudentFilters.tsx

import { useState, useEffect } from 'react';
import { FilterBar } from '../shared/FilterBar';
import { StudentFilters as StudentFiltersType } from '@/types/gov/student';

interface StudentFiltersProps {
  filters: StudentFiltersType;
  onFilterChange: (filters: StudentFiltersType) => void;
  regions?: string[];
  schools?: { code: string; name: string }[];
  levels?: string[];
  className?: string;
}

export function StudentFilters({
  filters,
  onFilterChange,
  regions = [],
  schools = [],
  levels = [],
  className
}: StudentFiltersProps) {
  const [localFilters, setLocalFilters] = useState<StudentFiltersType>(filters);

  useEffect(() => {
    onFilterChange(localFilters);
  }, [localFilters, onFilterChange]);

  const handleSearchChange = (search: string) => {
    setLocalFilters(prev => ({ ...prev, search }));
  };

  const handleRegionChange = (region: string) => {
    setLocalFilters(prev => ({ ...prev, region: region || undefined }));
  };

  const handleSchoolChange = (school: string) => {
    setLocalFilters(prev => ({ ...prev, school: school || undefined }));
  };

  const handleStatusChange = (status: string) => {
    setLocalFilters(prev => ({ 
      ...prev, 
      status: status as 'active' | 'inactive' | 'suspended' | undefined 
    }));
  };

  const handleLevelChange = (level: string) => {
    setLocalFilters(prev => ({ ...prev, level: level || undefined }));
  };

  const handleClearFilters = () => {
    setLocalFilters({});
  };

  const hasActiveFilters = Object.keys(localFilters).length > 0;

  return (
    <FilterBar
      className={className}
      searchPlaceholder="Search by name or TSID..."
      searchValue={localFilters.search}
      onSearchChange={handleSearchChange}
    >
      {regions.length > 0 && (
        <select
          className="rounded-md border bg-background px-3 py-2 text-sm"
          value={localFilters.region || ''}
          onChange={(e) => handleRegionChange(e.target.value)}
        >
          <option value="">All Regions</option>
          {regions.map((region) => (
            <option key={region} value={region}>{region}</option>
          ))}
        </select>
      )}

      {schools.length > 0 && (
        <select
          className="rounded-md border bg-background px-3 py-2 text-sm"
          value={localFilters.school || ''}
          onChange={(e) => handleSchoolChange(e.target.value)}
        >
          <option value="">All Schools</option>
          {schools.map((school) => (
            <option key={school.code} value={school.code}>{school.name}</option>
          ))}
        </select>
      )}

      {levels.length > 0 && (
        <select
          className="rounded-md border bg-background px-3 py-2 text-sm"
          value={localFilters.level || ''}
          onChange={(e) => handleLevelChange(e.target.value)}
        >
          <option value="">All Levels</option>
          {levels.map((level) => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
      )}

      <select
        className="rounded-md border bg-background px-3 py-2 text-sm"
        value={localFilters.status || ''}
        onChange={(e) => handleStatusChange(e.target.value)}
      >
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="suspended">Suspended</option>
      </select>

      {hasActiveFilters && (
        <button
          onClick={handleClearFilters}
          className="text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          Clear filters
        </button>
      )}

      <span className="text-xs text-muted-foreground self-center">
        {regions.length > 0 && ${regions.length} regions}
      </span>
    </FilterBar>
  );
}
