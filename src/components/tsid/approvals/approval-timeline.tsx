// src/components/tsid/approvals/approval-timeline.tsx
import { ReactNode } from "react";

interface TimelineEvent {
  id: string;
  action: string;
  description: string;
  actor: string;
  timestamp: string;
}

interface ApprovalTimelineProps {
  approvalId: string;
  events?: TimelineEvent[];
}

export default function ApprovalTimeline({ approvalId, events = [] }: ApprovalTimelineProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Timeline</h3>
      {events.length === 0 && (
        <p className="text-sm text-muted-foreground">No timeline events</p>
      )}
      <div className="relative">
        {events.map((event, index) => (
          <div key={event.id} className="flex gap-4 pb-4 border-l-2 border-muted pl-4 ml-2 relative">
            <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-primary"></div>
            <div>
              <div className="text-sm font-medium">{event.action}</div>
              <div className="text-sm text-muted-foreground">{event.description}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {event.actor}  {new Date(event.timestamp).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
