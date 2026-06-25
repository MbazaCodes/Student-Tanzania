// src/lib/lazy-load.ts
// Lazy loading utilities for React components

import { lazy, Suspense } from 'react';

// Higher-order component for lazy loading with fallback
export function lazyLoad<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback: React.ReactNode = <div className="animate-pulse p-4">Loading...</div>
): React.FC<React.ComponentProps<T>> {
  const LazyComponent = lazy(importFn);

  return (props) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

// Example usage:
// const StudentTable = lazyLoad(() => import('@/components/gov/students/StudentTable'));

// Route-based code splitting configuration
export const routeConfig = {
  // Government module routes
  gov: {
    dashboard: () => import('@/routes/_authenticated/gov.index'),
    students: () => import('@/routes/_authenticated/gov.students'),
    schools: () => import('@/routes/_authenticated/gov.schools'),
    admins: () => import('@/routes/_authenticated/gov.admins'),
    approvals: () => import('@/routes/_authenticated/gov.approvals'),
    logs: () => import('@/routes/_authenticated/gov.logs'),
  },
};
