// src/components/gov/analytics/RegionalChart.tsx

import { RegionStats } from '@/types/gov/analytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface RegionalChartProps {
  data: RegionStats[];
  title?: string;
  description?: string;
  className?: string;
  maxItems?: number;
}

export function RegionalChart({ 
  data, 
  title = 'Regional Distribution', 
  description = 'Students and schools by region',
  className,
  maxItems = 15
}: RegionalChartProps) {
  const sortedData = [...data]
    .sort((a, b) => b.studentCount - a.studentCount)
    .slice(0, maxItems);

  const maxStudents = sortedData.length > 0 ? sortedData[0].studentCount : 1;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedData.map((region) => (
            <div key={region.region}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium truncate max-w-[150px]">{region.region}</span>
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground text-xs">
                    {region.schoolCount} schools
                  </span>
                  <span className="font-mono">{region.studentCount}</span>
                </div>
              </div>
              <div className="flex gap-1 h-2">
                <div 
                  className="h-full bg-primary rounded-l-full"
                  style={{ width: ${(region.studentCount / maxStudents) * 100}% }}
                />
                <div 
                  className="h-full bg-blue-300 rounded-r-full"
                  style={{ width: ${(region.schoolCount / maxStudents) * 100}% }}
                />
              </div>
              {region.approvalRate > 0 && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  Approval rate: {Math.round(region.approvalRate)}%
                </div>
              )}
            </div>
          ))}
          {sortedData.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">
              No regional data available
            </p>
          )}
        </div>
        <div className="flex items-center gap-4 mt-4 pt-2 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="h-2 w-4 bg-primary rounded" />
            Students
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-4 bg-blue-300 rounded" />
            Schools
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
