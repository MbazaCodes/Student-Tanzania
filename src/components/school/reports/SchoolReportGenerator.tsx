// src/components/school/reports/SchoolReportGenerator.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ReportGeneratorProps {
  classes?: { id: string; name: string }[];
  onGenerate?: (params: ReportParams) => Promise<void>;
}

export interface ReportParams {
  type: 'student' | 'class' | 'teacher' | 'attendance';
  format: 'pdf' | 'excel' | 'csv';
  classId?: string;
  dateFrom?: string;
  dateTo?: string;
  includeCharts?: boolean;
}

export function SchoolReportGenerator({ classes = [], onGenerate }: ReportGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState<ReportParams>({
    type: 'student',
    format: 'pdf',
    includeCharts: true,
  });

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await onGenerate?.(params);
      toast.success('Report generated successfully!');
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Generate Report
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Report Type *</Label>
              <Select
                value={params.type}
                onValueChange={(value) => setParams(prev => ({ 
                  ...prev, 
                  type: value as ReportParams['type'] 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student Report</SelectItem>
                  <SelectItem value="class">Class Report</SelectItem>
                  <SelectItem value="teacher">Teacher Report</SelectItem>
                  <SelectItem value="attendance">Attendance Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Format *</Label>
              <Select
                value={params.format}
                onValueChange={(value) => setParams(prev => ({ 
                  ...prev, 
                  format: value as ReportParams['format'] 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {classes.length > 0 && (
              <div className="col-span-2 space-y-2">
                <Label>Class (Optional)</Label>
                <Select
                  value={params.classId || ''}
                  onValueChange={(value) => setParams(prev => ({ 
                    ...prev, 
                    classId: value || undefined 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Classes</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Date From</Label>
              <Input
                type="date"
                value={params.dateFrom || ''}
                onChange={(e) => setParams(prev => ({ 
                  ...prev, 
                  dateFrom: e.target.value || undefined 
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Date To</Label>
              <Input
                type="date"
                value={params.dateTo || ''}
                onChange={(e) => setParams(prev => ({ 
                  ...prev, 
                  dateTo: e.target.value || undefined 
                }))}
              />
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={params.includeCharts}
                  onChange={(e) => setParams(prev => ({ 
                    ...prev, 
                    includeCharts: e.target.checked 
                  }))}
                  className="rounded"
                />
                Include Charts
              </label>
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
