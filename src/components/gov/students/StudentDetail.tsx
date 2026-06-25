// src/components/gov/students/StudentDetail.tsx

import { GovStudent } from '@/types/gov/student';
import { StatusBadge } from '../shared/StatusBadge';
import { cn } from '@/lib/utils';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  School, 
  Badge,
  X
} from 'lucide-react';

interface StudentDetailProps {
  student: GovStudent | null;
  onClose?: () => void;
  className?: string;
}

export function StudentDetail({ student, onClose, className }: StudentDetailProps) {
  if (!student) {
    return null;
  }

  const infoItems = [
    { label: 'Full Name', value: student.fullname, icon: User },
    { label: 'TSID', value: student.tsid, icon: Badge },
    { label: 'Gender', value: student.gender || '', icon: User },
    { label: 'Date of Birth', value: student.dob || '', icon: Calendar },
    { label: 'Region', value: student.region || '', icon: MapPin },
    { label: 'District', value: student.district || '', icon: MapPin },
    { label: 'School', value: student.school_name || '', icon: School },
    { label: 'School Code', value: student.school_code || '', icon: School },
    { label: 'Level', value: student.level || '', icon: School },
    { label: 'Status', value: <StatusBadge status={student.status} />, icon: User },
  ];

  return (
    <div className={cn('fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto', className)}>
      {/* Header */}
      <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {student.photo ? (
            <img 
              src={student.photo} 
              className="w-12 h-16 object-cover rounded-lg border" 
              alt={student.fullname}
            />
          ) : (
            <div className="w-12 h-16 rounded-lg border bg-muted flex items-center justify-center text-3xl">
              
            </div>
          )}
          <div>
            <h2 className="font-bold text-lg">{student.fullname}</h2>
            <p className="text-xs text-muted-foreground font-mono">{student.tsid}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-muted rounded-full transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Info Grid */}
        <div className="space-y-4">
          {infoItems.map((item, index) => (
            <div key={index} className="flex items-start gap-3">
              <item.icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  {item.label}
                </div>
                <div className="text-sm font-medium mt-0.5">
                  {item.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="border-t pt-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">
            Registered
          </div>
          <div className="text-sm mt-0.5">
            {new Date(student.created_at).toLocaleString('en-TZ', {
              dateStyle: 'long',
              timeStyle: 'short'
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
