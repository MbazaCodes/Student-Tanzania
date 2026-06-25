// src/components/gov/analytics/TrendChart.tsx

import { TrendData } from '@/types/gov/analytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TrendChartProps {
  data: TrendData[];
  title?: string;
  description?: string;
  className?: string;
  showSchools?: boolean;
  showApprovals?: boolean;
}

export function TrendChart({ 
  data, 
  title = 'Growth Trends', 
  description = 'Student growth over time',
  className,
  showSchools = true,
  showApprovals = true
}: TrendChartProps) {
  const sortedData = [...data].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const maxValue = Math.max(
    ...sortedData.map(d => d.students),
    ...(showSchools ? sortedData.map(d => d.schools) : []),
    ...(showApprovals ? sortedData.map(d => d.approvals) : [])
  ) || 1;

  const points = sortedData.map((d, index) => {
    const x = (index / Math.max(sortedData.length - 1, 1)) * 100;
    return {
      students: (d.students / maxValue) * 80,
      schools: (d.schools / maxValue) * 80,
      approvals: (d.approvals / maxValue) * 80,
      x,
      label: new Date(d.date).toLocaleDateString('en-TZ', { month: 'short', year: 'numeric' }),
      value: d.students,
    };
  });

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative h-48">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {[0, 25, 50, 75, 100].map((y) => (
              <div key={y} className="border-t border-muted/30 flex items-center">
                <span className="text-[10px] text-muted-foreground -mt-1.5">
                  {Math.round((maxValue / 100) * (100 - y))}
                </span>
              </div>
            ))}
          </div>

          {/* Data lines */}
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            {/* Students line */}
            <polyline
              points={points.map(p => ${p.x},).join(' ')}
              fill="none"
              stroke="var(--tz-navy)"
              strokeWidth="2"
              className="stroke-primary"
            />
            
            {showSchools && (
              <polyline
                points={points.map(p => ${p.x},).join(' ')}
                fill="none"
                stroke="var(--tz-blue)"
                strokeWidth="2"
                className="stroke-blue-400"
              />
            )}
            
            {showApprovals && (
              <polyline
                points={points.map(p => ${p.x},).join(' ')}
                fill="none"
                stroke="var(--tz-gold)"
                strokeWidth="2"
                className="stroke-amber-400"
              />
            )}
          </svg>
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
          {points.filter((_, i) => i % Math.max(1, Math.floor(points.length / 6)) === 0).map((p) => (
            <span key={p.label} className="truncate max-w-[60px]">{p.label}</span>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-2 border-t text-xs text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1">
            <span className="h-2 w-4 bg-primary rounded" />
            Students
          </div>
          {showSchools && (
            <div className="flex items-center gap-1">
              <span className="h-2 w-4 bg-blue-400 rounded" />
              Schools
            </div>
          )}
          {showApprovals && (
            <div className="flex items-center gap-1">
              <span className="h-2 w-4 bg-amber-400 rounded" />
              Approvals
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
