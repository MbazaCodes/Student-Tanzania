// src/components/district/dashboard/DistrictSchoolList.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@tanstack/react-router';
import { Building2, Users, ChevronRight } from 'lucide-react';

interface School {
  id: string;
  name: string;
  code: string;
  studentCount: number;
  status: 'active' | 'suspended';
}

interface DistrictSchoolListProps {
  schools: School[];
}

export function DistrictSchoolList({ schools }: DistrictSchoolListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>Schools in District</span>
          <Link to="/district/schools" className="text-xs text-primary hover:underline">
            View All
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {schools.slice(0, 5).map((school) => (
            <Link
              key={school.id}
              to="/district/schools"
              className="flex items-center justify-between p-2 hover:bg-muted/20 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">{school.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{school.code}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs">{school.studentCount}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          ))}
          {schools.length === 0 && (
            <div className="text-center text-muted-foreground py-4 text-sm">
              No schools found in this district
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
