// src/components/student/academics/AcademicsOverview.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  teacher: string;
  grade: string;
  score: number;
  status: 'passed' | 'failed' | 'pending';
}

interface AcademicsOverviewProps {
  subjects: Subject[];
  gpa: number;
  totalCredits: number;
  completedCredits: number;
}

export function AcademicsOverview({ subjects, gpa, totalCredits, completedCredits }: AcademicsOverviewProps) {
  const passed = subjects.filter(s => s.status === 'passed').length;
  const failed = subjects.filter(s => s.status === 'failed').length;
  const pending = subjects.filter(s => s.status === 'pending').length;

  const getGradeColor = (grade: string) => {
    const gradeMap: Record<string, string> = {
      'A': 'text-green-600 bg-green-100',
      'B': 'text-blue-600 bg-blue-100',
      'C': 'text-amber-600 bg-amber-100',
      'D': 'text-orange-600 bg-orange-100',
      'F': 'text-red-600 bg-red-100',
    };
    return gradeMap[grade] || 'text-gray-600 bg-gray-100';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">GPA</div>
            <div className="text-2xl font-bold">{gpa.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Subjects</div>
            <div className="text-2xl font-bold">{subjects.length}</div>
            <div className="text-xs text-muted-foreground">
              {passed} passed, {failed} failed, {pending} pending
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Credits</div>
            <div className="text-2xl font-bold">{completedCredits} / {totalCredits}</div>
            <Progress value={(completedCredits / totalCredits) * 100} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Pass Rate</div>
            <div className="text-2xl font-bold">
              {subjects.length > 0 ? Math.round((passed / subjects.length) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subjects List */}
      <Card>
        <CardHeader>
          <CardTitle>Subjects</CardTitle>
          <CardDescription>Your current subjects and grades</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subjects.map((subject) => (
              <div key={subject.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{subject.name}</div>
                    <div className="text-xs text-muted-foreground">{subject.teacher}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className={getGradeColor(subject.grade)}>
                    {subject.grade} ({subject.score}%)
                  </Badge>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(subject.status)}
                    <span className="text-xs capitalize">{subject.status}</span>
                  </div>
                </div>
              </div>
            ))}
            {subjects.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No subjects found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
