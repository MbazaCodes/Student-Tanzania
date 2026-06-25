import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  children: ReactNode;
  className?: string;
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export function FilterBar({
  children,
  className,
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
}: FilterBarProps) {
  return (
    <div className={cn('flex flex-wrap gap-3 items-center', className)}>
      {onSearchChange && (
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue || ''}
          onChange={(e) => onSearchChange(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm max-w-xs flex-1 min-w-[200px]"
        />
      )}
      {children}
    </div>
  );
}
