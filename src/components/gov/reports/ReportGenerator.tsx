// src/components/gov/reports/ReportGenerator.tsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, FileText, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ReportGeneratorProps {
  regions?: string[];
  schoolTypes?: string[];
  onGenerate?: (params: ReportParams) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export interface ReportParams {
  type: 'student' | 'school' | 'regional' | 'approval' | 'custom';
  format: 'pdf' | 'excel' | 'csv';
  region?: string;
  schoolType?: string;
  dateFrom?: string;
  dateTo?: string;
  includeCharts?: boolean;
  includeDetails?: boolean;
}

export function ReportGenerator({ 
  regions = [],
  schoolTypes = [],
  onGenerate,
  isLoading = false,
  className
}: ReportGeneratorProps) {
  const [params, setParams] = useState<ReportParams>({
    type: 'student',
    format: 'pdf',
    includeCharts: true,
    includeDetails: true,
  });

  const handleGenerate = async () => {
    if (!onGenerate) {
      toast.info('Report generation handler not configured');
      return;
    }

    try {
      await onGenerate(params);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate report');
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Generate Report
        </CardTitle>
        <CardDescription>
          Configure and generate custom reports
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Report Type */}
          <div className="space-y-1.5">
            <Label>Report Type *</Label>
            <Select 
              value={params.type} 
              onValueChange={(v) => setParams(prev => ({ ...prev, type: v as ReportParams['type'] }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student Report</SelectItem>
                <SelectItem value="school">School Report</SelectItem>
                <SelectItem value="regional">Regional Report</SelectItem>
                <SelectItem value="approval">Approval Report</SelectItem>
                <SelectItem value="custom">Custom Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Format */}
          <div className="space-y-1.5">
            <Label>Format *</Label>
            <Select 
              value={params.format} 
              onValueChange={(v) => setParams(prev => ({ ...prev, format: v as ReportParams['format'] }))}
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

          {/* Region Filter */}
          {regions.length > 0 && (
            <div className="space-y-1.5">
              <Label>Region</Label>
              <Select 
                value={params.region || ''} 
                onValueChange={(v) => setParams(prev => ({ ...prev, region: v || undefined }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Regions</SelectItem>
                  {regions.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* School Type Filter */}
          {schoolTypes.length > 0 && (
            <div className="space-y-1.5">
              <Label>School Type</Label>
              <Select 
                value={params.schoolType || ''} 
                onValueChange={(v) => setParams(prev => ({ ...prev, schoolType: v || undefined }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  {schoolTypes.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date From</Label>
              <Input 
                type="date"
                value={params.dateFrom || ''} 
                onChange={(e) => setParams(prev => ({ ...prev, dateFrom: e.target.value || undefined }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Date To</Label>
              <Input 
                type="date"
                value={params.dateTo || ''} 
                onChange={(e) => setParams(prev => ({ ...prev, dateTo: e.target.value || undefined }))}
              />
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2">
            <Label>Options</Label>
            <div className="flex gap-4 flex-wrap">
              <label className="flex items-center gap-2 text-sm">
                <input 
                  type="checkbox"
                  checked={params.includeCharts}
                  onChange={(e) => setParams(prev => ({ ...prev, includeCharts: e.target.checked }))}
                  className="rounded"
                />
                Include Charts
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input 
                  type="checkbox"
                  checked={params.includeDetails}
                  onChange={(e) => setParams(prev => ({ ...prev, includeDetails: e.target.checked }))}
                  className="rounded"
                />
                Include Details
              </label>
            </div>
          </div>

          {/* Generate Button */}
          <Button 
            className="w-full bg-primary" 
            onClick={handleGenerate}
            disabled={isLoading}
          >
            {isLoading ? (
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
