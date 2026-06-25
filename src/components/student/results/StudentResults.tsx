// src/components/student/results/StudentResults.tsx
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Download,
  Printer,
  Eye,
  Award,
  Star,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExamResult {
  id: string;
  examName: string;
  term: string;
  year: string;
  performance: 'Pass' | 'Medium' | 'Fair';
  averageScore: number;
  position: number;
  totalStudents: number;
  remarks: string;
  strengths?: string[];
  improvements?: string[];
}

interface StudentResultsProps {
  results: ExamResult[];
  onViewDetails?: (resultId: string) => void;
  onDownload?: (resultId: string) => void;
  onPrint?: (resultId: string) => void;
}

const PERFORMANCE_COLORS = {
  Pass: 'bg-green-100 text-green-700 border-green-200',
  Medium: 'bg-blue-100 text-blue-700 border-blue-200',
  Fair: 'bg-amber-100 text-amber-700 border-amber-200',
};

const PERFORMANCE_ICONS = {
  Pass: CheckCircle,
  Medium: Info,
  Fair: AlertCircle,
};

export function StudentResults({ results, onViewDetails, onDownload, onPrint }: StudentResultsProps) {
  const [selectedTerm, setSelectedTerm] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  const terms = [...new Set(results.map(r => r.term))];
  const years = [...new Set(results.map(r => r.year))];

  const filteredResults = results.filter(r => {
    if (selectedTerm !== 'all' && r.term !== selectedTerm) return false;
    if (selectedYear !== 'all' && r.year !== selectedYear) return false;
    return true;
  });

  // Summary stats
  const totalExams = filteredResults.length;
  const passCount = filteredResults.filter(r => r.performance === 'Pass').length;
  const mediumCount = filteredResults.filter(r => r.performance === 'Medium').length;
  const fairCount = filteredResults.filter(r => r.performance === 'Fair').length;
  const avgScore = filteredResults.length > 0 
    ? filteredResults.reduce((sum, r) => sum + r.averageScore, 0) / filteredResults.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Exams Taken</div>
            <div className="text-2xl font-bold">{totalExams}</div>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Pass</div>
            <div className="text-2xl font-bold text-green-600">{passCount}</div>
          </CardContent>
        </Card>
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Medium</div>
            <div className="text-2xl font-bold text-blue-600">{mediumCount}</div>
          </CardContent>
        </Card>
        <Card className="border-amber-200">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Fair</div>
            <div className="text-2xl font-bold text-amber-600">{fairCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Average Score */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Average Score</div>
              <div className="text-3xl font-bold">{avgScore.toFixed(1)}%</div>
            </div>
            <div className="text-sm text-muted-foreground">
              {totalExams} exam{totalExams !== 1 ? 's' : ''} recorded
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Term:</span>
          <Select value={selectedTerm} onValueChange={setSelectedTerm}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Terms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Terms</SelectItem>
              {terms.map(term => (
                <SelectItem key={term} value={term}>{term}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Year:</span>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {years.map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''} found
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {filteredResults.map((result) => {
          const Icon = PERFORMANCE_ICONS[result.performance];
          const colorClass = PERFORMANCE_COLORS[result.performance];
          
          return (
            <Card key={result.id}>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {result.examName}
                      <Badge className={colorClass}>
                        <Icon className="h-3 w-3 mr-1" />
                        {result.performance}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {result.term}  {result.year}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Score</div>
                      <div className="text-xl font-bold">{result.averageScore}%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Position</div>
                      <div className="text-xl font-bold">#{result.position}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Total</div>
                      <div className="text-xl font-bold">{result.totalStudents}</div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Remarks */}
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="text-sm font-medium mb-1"> Remarks</div>
                    <div className="text-sm text-muted-foreground">{result.remarks}</div>
                  </div>

                  {/* Strengths & Improvements */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.strengths && result.strengths.length > 0 && (
                      <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                        <div className="text-sm font-medium text-green-700 mb-1"> Strengths</div>
                        <ul className="text-sm text-green-600 space-y-1">
                          {result.strengths.map((s, i) => (
                            <li key={i}> {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {result.improvements && result.improvements.length > 0 && (
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                        <div className="text-sm font-medium text-amber-700 mb-1"> Areas for Improvement</div>
                        <ul className="text-sm text-amber-600 space-y-1">
                          {result.improvements.map((s, i) => (
                            <li key={i}> {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <Button size="sm" variant="outline" onClick={() => onViewDetails?.(result.id)}>
                      <Eye className="h-3 w-3 mr-2" />
                      View Details
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onDownload?.(result.id)}>
                      <Download className="h-3 w-3 mr-2" />
                      Download
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onPrint?.(result.id)}>
                      <Printer className="h-3 w-3 mr-2" />
                      Print
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filteredResults.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No results found for the selected filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
