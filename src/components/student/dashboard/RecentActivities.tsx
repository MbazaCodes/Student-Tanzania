// src/components/student/dashboard/RecentActivities.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';

interface Activity {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'academic' | 'fee' | 'attendance' | 'exam';
}

interface RecentActivitiesProps {
  activities: Activity[];
}

const TYPE_COLORS = {
  academic: 'bg-blue-100 text-blue-600',
  fee: 'bg-green-100 text-green-600',
  attendance: 'bg-amber-100 text-amber-600',
  exam: 'bg-purple-100 text-purple-600',
};

export function RecentActivities({ activities }: RecentActivitiesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Recent Activities
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[activity.type]}`}>
                {activity.type}
              </span>
              <div className="flex-1">
                <div className="text-sm font-medium">{activity.title}</div>
                <div className="text-xs text-muted-foreground">{activity.description}</div>
                <div className="text-xs text-muted-foreground mt-1">{activity.time}</div>
              </div>
            </div>
          ))}
          {activities.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-4">
              No recent activities
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
