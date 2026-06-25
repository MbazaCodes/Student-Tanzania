// src/components/school/shared/SchoolLayout.tsx
import { ReactNode } from 'react';
import { SchoolSidebar } from './SchoolSidebar';
import { SchoolHeader } from './SchoolHeader';

interface SchoolLayoutProps {
  children: ReactNode;
  title?: string;
}

export function SchoolLayout({ children, title }: SchoolLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <SchoolSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <SchoolHeader title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
