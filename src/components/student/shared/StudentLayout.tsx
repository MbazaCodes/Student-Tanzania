// src/components/student/shared/StudentLayout.tsx
import { ReactNode } from 'react';
import { StudentSidebar } from './StudentSidebar';
import { StudentHeader } from './StudentHeader';

interface StudentLayoutProps {
  children: ReactNode;
  title?: string;
}

export function StudentLayout({ children, title }: StudentLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <StudentSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <StudentHeader title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
