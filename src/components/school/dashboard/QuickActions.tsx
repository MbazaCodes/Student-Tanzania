// src/components/school/dashboard/QuickActions.tsx
import { Plus, UserPlus, BookOpen, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QuickAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'outline';
}

interface QuickActionsProps {
  actions?: QuickAction[];
  onRegisterStudent?: () => void;
  onAddTeacher?: () => void;
  onCreateClass?: () => void;
  onGenerateReport?: () => void;
}

const defaultActions = [
  { label: 'Register Student', icon: <UserPlus className="h-4 w-4" />, variant: 'default' as const },
  { label: 'Add Teacher', icon: <Plus className="h-4 w-4" />, variant: 'outline' as const },
  { label: 'Create Class', icon: <BookOpen className="h-4 w-4" />, variant: 'outline' as const },
  { label: 'Generate Report', icon: <FileText className="h-4 w-4" />, variant: 'outline' as const },
];

export function QuickActions({ 
  actions = defaultActions,
  onRegisterStudent,
  onAddTeacher,
  onCreateClass,
  onGenerateReport,
}: QuickActionsProps) {
  const actionHandlers: Record<string, () => void> = {
    'Register Student': onRegisterStudent || (() => {}),
    'Add Teacher': onAddTeacher || (() => {}),
    'Create Class': onCreateClass || (() => {}),
    'Generate Report': onGenerateReport || (() => {}),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant || 'outline'}
              className="justify-start"
              onClick={actionHandlers[action.label] || action.onClick}
            >
              {action.icon}
              <span className="ml-2 text-sm">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
