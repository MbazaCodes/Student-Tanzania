// src/components/gov/dashboard/ActivityFeed.tsx

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface Activity {
  id: string;
  action: string;
  message: string;
  by_name?: string;
  by_role?: string;
  created_at: string;
  icon?: ReactNode;
  color?: string;
}

interface ActivityFeedProps {
  activities: Activity[];
  title?: string;
  maxItems?: number;
  className?: string;
  onViewAll?: () => void;
}

const ACTION_COLORS: Record<string, string> = {
  'school:create': 'text-violet-700 bg-violet-50',
  'student:create': 'text-emerald-700 bg-emerald-50',
  'auth:login': 'text-blue-700 bg-blue-50',
  'application:approve': 'text-emerald-700 bg-emerald-50',
  'application:reject': 'text-red-700 bg-red-50',
  'student:update': 'text-amber-700 bg-amber-50',
  'school:update': 'text-amber-700 bg-amber-50',
  'school:delete': 'text-red-700 bg-red-50',
  'student:delete': 'text-red-700 bg-red-50',
  'admin:create': 'text-purple-700 bg-purple-50',
  'admin:edit': 'text-purple-700 bg-purple-50',
  'admin:delete': 'text-red-700 bg-red-50',
};

export function ActivityFeed({ 
  activities, 
  title = 'Recent Activity', 
  maxItems = 10,
  className,
  onViewAll 
}: ActivityFeedProps) {
  const displayActivities = activities.slice(0, maxItems);

  if (displayActivities.length === 0) {
    return (
      <div className={cn('rounded-2xl border bg-card overflow-hidden', className)}>
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <span className="font-semibold text-sm">{title}</span>
        </div>
        <div className="px-4 py-8 text-sm text-center text-muted-foreground">
          No recent activity
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-2xl border bg-card overflow-hidden', className)}>
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <span className="font-semibold text-sm">{title}</span>
        {onViewAll && (
          <button 
            onClick={onViewAll}
            className="text-xs text-primary hover:underline"
          >
            View all
          </button>
        )}
      </div>
      <div className="divide-y">
        {displayActivities.map((activity) => {
          const colorClass = ACTION_COLORS[activity.action] || 'bg-muted text-muted-foreground';
          const actionLabel = activity.action.split(':')[1] || activity.action;
          
          return (
            <div key={activity.id} className="px-4 py-3 flex items-start gap-3">
              <span className={cn(
                'mt-0.5 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap flex-shrink-0',
                colorClass
              )}>
                {activity.icon || actionLabel}
              </span>
              <div className="min-w-0">
                <div className="text-sm truncate">{activity.message || activity.action}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {activity.by_name || 'system'}  {new Date(activity.created_at).toLocaleString('en-TZ', {
                    dateStyle: 'short',
                    timeStyle: 'short'
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
