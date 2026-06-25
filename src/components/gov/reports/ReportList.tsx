// src/components/gov/reports/ReportList.tsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  Download, 
  Trash2, 
  Eye, 
  Calendar,
  File,
  FileSpreadsheet,
  FileJson
} from 'lucide-react';
import { toast } from 'sonner';

interface Report {
  id: string;
  name: string;
  type: string;
  format: 'pdf' | 'excel' | 'csv';
  generatedAt: string;
  size: string;
  url?: string;
  status: 'ready' | 'generating' | 'failed';
}

interface ReportListProps {
  reports: Report[];
  onDownload?: (report: Report) => void;
  onDelete?: (id: string) => void;
  onView?: (report: Report) => void;
  className?: string;
}

const FORMAT_ICONS = {
  pdf: FileText,
  excel: FileSpreadsheet,
  csv: File,
};

const FORMAT_COLORS = {
  pdf: 'text-red-500',
  excel: 'text-green-500',
  csv: 'text-blue-500',
};

export function ReportList({ 
  reports, 
  onDownload, 
  onDelete, 
  onView,
  className 
}: ReportListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDelete?.(id);
      toast.success('Report deleted');
    } catch (error) {
      toast.error('Failed to delete report');
    } finally {
      setDeletingId(null);
    }
  };

  if (reports.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generated Reports
          </CardTitle>
          <CardDescription>Reports you've generated</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No reports generated yet</p>
            <p className="text-sm">Generate your first report using the form above</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const sortedReports = [...reports].sort((a, b) => 
    new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Generated Reports
        </CardTitle>
        <CardDescription>
          {reports.length} report{reports.length !== 1 ? 's' : ''} available
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedReports.map((report) => {
            const Icon = FORMAT_ICONS[report.format] || File;
            const iconColor = FORMAT_COLORS[report.format] || 'text-muted-foreground';

            return (
              <div 
                key={report.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center bg-muted', iconColor)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{report.name}</div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="capitalize">{report.type}</span>
                      <span></span>
                      <span className="uppercase">{report.format}</span>
                      <span></span>
                      <span>{report.size}</span>
                      <span></span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(report.generatedAt).toLocaleDateString('en-TZ', {
                          dateStyle: 'short',
                          timeStyle: 'short'
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {onView && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => onView(report)}
                      title="View"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {onDownload && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => onDownload(report)}
                      title="Download"
                      disabled={report.status === 'generating'}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleDelete(report.id)}
                      disabled={deletingId === report.id}
                      className="text-red-500 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
