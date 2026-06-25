// src/components/regional/dashboard/SchoolDistribution.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface SchoolDistributionProps {
  districts: {
    name: string;
    schoolCount: number;
    studentCount: number;
    percentage: number;
  }[];
}

export function SchoolDistribution({ districts }: SchoolDistributionProps) {
  const maxSchools = Math.max(...districts.map(d => d.schoolCount), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">School Distribution by District</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {districts.map((district) => (
            <div key={district.name}>
              <div className="flex justify-between text-sm mb-1">
                <span>{district.name}</span>
                <span className="text-muted-foreground">
                  {district.schoolCount} schools  {district.studentCount} students
                </span>
              </div>
              <Progress 
                value={(district.schoolCount / maxSchools) * 100} 
                className="h-2"
              />
            </div>
          ))}
          {districts.length === 0 && (
            <div className="text-center text-muted-foreground py-4 text-sm">
              No district data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
