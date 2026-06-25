// src/components/school/dashboard/RecentActivity.tsx
import { ActivityFeed } from '@/components/gov/dashboard/ActivityFeed';

interface RecentActivityProps {
  activities: Array<{
    id: string;
    action: string;
    message: string;
    by_name?: string;
    created_at: string;
  }>;
  onViewAll?: () => void;
}

export function RecentActivity({ activities, onViewAll }: RecentActivityProps) {
  return (
    <ActivityFeed
      activities={activities}
      title="Recent Activity"
      onViewAll={onViewAll}
    />
  );
}
