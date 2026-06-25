// src/components/gov/analytics/DistributionChart.tsx

import { SchoolTypeDistribution, RegionalDistribution } from '@/types/gov/analytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DistributionChartProps {
  data: SchoolTypeDistribution[] | RegionalDistribution[];
  type: 'school_type' | 'region';
  title?: string;
  description?: string;
  className?: string;
}

export function DistributionChart({ 
  data, 
  type,
  title = 'Distribution',
  description = 'Distribution by category',
  className
}: DistributionChartProps) {
  const sortedData = [...data]
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const total = sortedData.reduce((sum, d) => sum + d.count, 0);
  const colors = ['#1EB53A', '#007AFF', '#F5C400', '#E74C3C', '#8E44AD', '#2ECC71', '#E67E22', '#1ABC9C', '#3498DB', '#9B59B6', '#F39C12', '#2C3E50'];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedData.map((item, index) => {
            const label = type === 'school_type' 
              ? (item as SchoolTypeDistribution).type 
              : (item as RegionalDistribution).region;
            const count = item.count;
            const percentage = total > 0 ? (count / total) * 100 : 0;
            const color = colors[index % colors.length];

            return (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="truncate max-w-[200px]">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">
                      {percentage.toFixed(1)}%
                    </span>
                    <span className="font-mono">{count}</span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: ${percentage}%,
                      backgroundColor: color
                    }}
                  />
                </div>
              </div>
            );
          })}
          {sortedData.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">
              No distribution data available
            </p>
          )}
        </div>
        <div className="mt-4 pt-2 border-t text-xs text-muted-foreground">
          Total: {total} items
        </div>
      </CardContent>
    </Card>
  );
}
