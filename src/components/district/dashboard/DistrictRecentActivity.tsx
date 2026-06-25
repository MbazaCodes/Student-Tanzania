// src/components/district/dashboard/DistrictRecentActivity.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Activity {
  id: string;
  type: 'student_registered' | 'approval_pending' | 'report_generated' | 'school_updated';
  description: string;
  time: string;
}

interface DistrictRecentActivityProps {
  activities: Activity[];
}

const TYPE_ICONS = {
  student_registered: CheckCircle,
  approval_pending: AlertCircle,
  report_generated: Activity,
  school_updated: Clock,
};

const TYPE_COLORS = {
  student_registered: 'text-green-600 bg-green-100',
  approval_pending: 'text-amber-600 bg-amber-100',
  report_generated: 'text-purple-600 bg-purple-100',
  school_updated: 'text-blue-600 bg-blue-100',
};

export function DistrictRecentActivity({ activities }: DistrictRecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = TYPE_ICONS[activity.type];
            const colorClass = TYPE_COLORS[activity.type];
            return (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={`p-1.5 rounded-full ${colorClass}`}>
                  <Icon className="h-3 w-3" />
                </div>
                <div className="flex-1">
                  <div className="text-sm">{activity.description}</div>
                  <div className="text-xs text-muted-foreground">{activity.time}</div>
                </div>
              </div>
            );
          })}
          {activities.length === 0 && (
            <div className="text-center text-muted-foreground py-4 text-sm">
              No recent activity
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
