// src/components/regional/schools/RegionalSchoolDetail.tsx
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Users, 
  GraduationCap, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  Eye,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface School {
  id: string;
  name: string;
  code: string;
  district: string;
  type: string;
  studentCount: number;
  teacherCount: number;
  status: 'active' | 'suspended';
  registeredDate: string;
  address?: string;
  phone?: string;
  email?: string;
  principal?: string;
}

interface RegionalSchoolDetailProps {
  school: School | null;
  onClose?: () => void;
  onViewStudents?: (school: School) => void;
}

export function RegionalSchoolDetail({ school, onClose, onViewStudents }: RegionalSchoolDetailProps) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!school) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg">{school.name}</h2>
          <p className="text-xs text-muted-foreground font-mono">{school.code}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-muted rounded-full transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-3 text-center">
              <Users className="h-4 w-4 mx-auto text-muted-foreground" />
              <div className="text-lg font-bold">{school.studentCount}</div>
              <div className="text-xs text-muted-foreground">Students</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <GraduationCap className="h-4 w-4 mx-auto text-muted-foreground" />
              <div className="text-lg font-bold">{school.teacherCount}</div>
              <div className="text-xs text-muted-foreground">Teachers</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <Badge className={cn(
                "text-xs",
                school.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              )}>
                {school.status}
              </Badge>
              <div className="text-xs text-muted-foreground mt-1">Status</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">District</div>
                <div className="font-medium">{school.district}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Type</div>
                <div className="font-medium">{school.type}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Principal</div>
                <div className="font-medium">{school.principal || ''}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Registered</div>
                <div className="font-medium">{new Date(school.registeredDate).toLocaleDateString()}</div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="details" className="space-y-4 pt-4">
            <div className="space-y-3">
              {school.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Address</div>
                    <div>{school.address}</div>
                  </div>
                </div>
              )}
              {school.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Phone</div>
                    <div>{school.phone}</div>
                  </div>
                </div>
              )}
              {school.email && (
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Email</div>
                    <div>{school.email}</div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="border-t pt-4 flex gap-2">
          <Button className="flex-1" onClick={() => onViewStudents?.(school)}>
            <Users className="h-4 w-4 mr-2" />
            View Students
          </Button>
          <Button variant="outline" className="flex-1">
            <Building2 className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
}
