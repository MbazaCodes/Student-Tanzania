// src/components/regional/reports/RegionalReportGenerator.tsx
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Download, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface RegionalReportGeneratorProps {
  districts?: string[];
  onGenerate?: (params: ReportParams) => Promise<void>;
}

export interface ReportParams {
  type: 'schools' | 'students' | 'performance' | 'attendance';
  format: 'pdf' | 'excel' | 'csv';
  district?: string;
  dateFrom?: string;
  dateTo?: string;
  includeCharts?: boolean;
}

export function RegionalReportGenerator({ districts = [], onGenerate }: RegionalReportGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState<ReportParams>({
    type: 'schools',
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
          Generate Regional Report
        </CardTitle>
        <CardDescription>
          Generate comprehensive reports for your region
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <SelectItem value="schools">Schools Report</SelectItem>
                  <SelectItem value="students">Students Report</SelectItem>
                  <SelectItem value="performance">Performance Report</SelectItem>
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
            {districts.length > 0 && (
              <div className="space-y-2">
                <Label>District (Optional)</Label>
                <Select
                  value={params.district || ''}
                  onValueChange={(value) => setParams(prev => ({
                    ...prev,
                    district: value || undefined
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Districts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Districts</SelectItem>
                    {districts.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                  value={params.dateFrom || ''}
                  onChange={(e) => setParams(prev => ({
                    ...prev,
                    dateFrom: e.target.value || undefined
                  }))}
                />
                <input
                  type="date"
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                  value={params.dateTo || ''}
                  onChange={(e) => setParams(prev => ({
                    ...prev,
                    dateTo: e.target.value || undefined
                  }))}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={params.includeCharts}
                onCheckedChange={(checked) => setParams(prev => ({
                  ...prev,
                  includeCharts: checked
                }))}
              />
              <Label>Include Charts</Label>
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
