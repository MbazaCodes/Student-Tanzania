// src/components/student/attendance/StudentAttendance.tsx
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttendanceRecord {
  id: string;
  date: string;
  subject: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  time: string;
  teacher: string;
}

interface StudentAttendanceProps {
  records: AttendanceRecord[];
  summary: {
    totalDays: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
  };
}

const STATUS_COLORS = {
  present: 'bg-green-100 text-green-600 border-green-200',
  absent: 'bg-red-100 text-red-600 border-red-200',
  late: 'bg-amber-100 text-amber-600 border-amber-200',
  excused: 'bg-blue-100 text-blue-600 border-blue-200',
};

const STATUS_ICONS = {
  present: CheckCircle,
  absent: XCircle,
  late: AlertCircle,
  excused: Clock,
};

const STATUS_LABELS = {
  present: 'Present',
  absent: 'Absent',
  late: 'Late',
  excused: 'Excused',
};

export function StudentAttendance({ records, summary }: StudentAttendanceProps) {
  const [filter, setFilter] = useState<string>('all');
  const [period, setPeriod] = useState<string>('all');

  const filteredRecords = records.filter(r => {
    if (filter !== 'all' && r.status !== filter) return false;
    return true;
  });

  const attendanceRate = summary.totalDays > 0 
    ? (summary.present / summary.totalDays) * 100 
    : 0;

  const getStatusBadge = (status: string) => {
    const Icon = STATUS_ICONS[status as keyof typeof STATUS_ICONS];
    return (
      <Badge className={cn("flex items-center gap-1", STATUS_COLORS[status as keyof typeof STATUS_COLORS])}>
        <Icon className="h-3 w-3" />
        {STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total Days</div>
            <div className="text-2xl font-bold">{summary.totalDays}</div>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Present</div>
            <div className="text-2xl font-bold text-green-600">{summary.present}</div>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Absent</div>
            <div className="text-2xl font-bold text-red-600">{summary.absent}</div>
          </CardContent>
        </Card>
        <Card className="border-amber-200">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Late</div>
            <div className="text-2xl font-bold text-amber-600">{summary.late}</div>
          </CardContent>
        </Card>
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Excused</div>
            <div className="text-2xl font-bold text-blue-600">{summary.excused}</div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Rate */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Attendance Rate</span>
            <span className="text-sm font-bold">{attendanceRate.toFixed(1)}%</span>
          </div>
          <Progress value={attendanceRate} className="h-3" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="present">Present</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
              <SelectItem value="late">Late</SelectItem>
              <SelectItem value="excused">Excused</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''} found
        </div>
      </div>

      {/* Records List */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>Your daily attendance history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredRecords.map((record) => (
              <div key={record.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-lg">
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <div className="font-medium">{record.subject}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(record.date).toLocaleDateString()}  {record.time}
                    </div>
                    <div className="text-xs text-muted-foreground">{record.teacher}</div>
                  </div>
                </div>
                {getStatusBadge(record.status)}
              </div>
            ))}
            {filteredRecords.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No attendance records found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
