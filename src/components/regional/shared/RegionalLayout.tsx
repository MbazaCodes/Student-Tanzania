// src/components/regional/shared/RegionalLayout.tsx
import { ReactNode } from 'react';
import { RegionalSidebar } from './RegionalSidebar';
import { RegionalHeader } from './RegionalHeader';

interface RegionalLayoutProps {
  children: ReactNode;
  title?: string;
  region?: string;
}

export function RegionalLayout({ children, title, region }: RegionalLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <RegionalSidebar region={region} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <RegionalHeader title={title} region={region} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
