// src/components/gov/schools/SchoolFilters.tsx

import { useState, useEffect } from 'react';
import { FilterBar } from '../shared/FilterBar';
import { SchoolFilters as SchoolFiltersType } from '@/types/gov/school';

interface SchoolFiltersProps {
  filters: SchoolFiltersType;
  onFilterChange: (filters: SchoolFiltersType) => void;
  regions?: string[];
  types?: string[];
  className?: string;
}

export function SchoolFilters({
  filters,
  onFilterChange,
  regions = [],
  types = [],
  className
}: SchoolFiltersProps) {
  const [localFilters, setLocalFilters] = useState<SchoolFiltersType>(filters);

  useEffect(() => {
    onFilterChange(localFilters);
  }, [localFilters, onFilterChange]);

  const handleSearchChange = (search: string) => {
    setLocalFilters(prev => ({ ...prev, search }));
  };

  const handleRegionChange = (region: string) => {
    setLocalFilters(prev => ({ ...prev, region: region || undefined }));
  };

  const handleTypeChange = (type: string) => {
    setLocalFilters(prev => ({ ...prev, type: type || undefined }));
  };

  const handleStatusChange = (status: string) => {
    setLocalFilters(prev => ({ 
      ...prev, 
      status: status as 'active' | 'suspended' | undefined 
    }));
  };

  const handleClearFilters = () => {
    setLocalFilters({});
  };

  const hasActiveFilters = Object.keys(localFilters).length > 0;

  return (
    <FilterBar
      className={className}
      searchPlaceholder="Search by school name or code..."
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

      {types.length > 0 && (
        <select
          className="rounded-md border bg-background px-3 py-2 text-sm"
          value={localFilters.type || ''}
          onChange={(e) => handleTypeChange(e.target.value)}
        >
          <option value="">All Types</option>
          {types.map((type) => (
            <option key={type} value={type}>{type}</option>
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
    </FilterBar>
  );
}
