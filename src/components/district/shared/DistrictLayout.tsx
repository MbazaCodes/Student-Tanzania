// src/components/district/shared/DistrictLayout.tsx
import { ReactNode } from 'react';
import { DistrictSidebar } from './DistrictSidebar';
import { DistrictHeader } from './DistrictHeader';

interface DistrictLayoutProps {
  children: ReactNode;
  title?: string;
  district?: string;
  region?: string;
}

export function DistrictLayout({ children, title, district, region }: DistrictLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <DistrictSidebar district={district} region={region} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DistrictHeader title={title} district={district} region={region} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
