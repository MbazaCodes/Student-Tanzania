// src/components/gov/reports/ReportExport.tsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet, FileJson, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ReportExportProps {
  data?: any;
  onExport: (format: 'pdf' | 'excel' | 'csv', data: any) => Promise<void>;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export function ReportExport({ 
  data, 
  onExport, 
  disabled = false,
  className,
  label = 'Export'
}: ReportExportProps) {
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    if (!data) {
      toast.error('No data to export');
      return;
    }

    setExporting(format);
    try {
      await onExport(format, data);
      toast.success(Report exported as );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : Failed to export as );
    } finally {
      setExporting(null);
    }
  };

  const formatLabels = {
    pdf: { label: 'PDF Document', icon: FileText },
    excel: { label: 'Excel Spreadsheet', icon: FileSpreadsheet },
    csv: { label: 'CSV File', icon: FileJson },
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          disabled={disabled || exporting !== null}
          className={className}
        >
          {exporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              {label}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(['pdf', 'excel', 'csv'] as const).map((format) => {
          const { label, icon: Icon } = formatLabels[format];
          return (
            <DropdownMenuItem 
              key={format}
              onClick={() => handleExport(format)}
              disabled={exporting !== null}
              className="cursor-pointer"
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
              <span className="ml-auto text-xs text-muted-foreground">.{format}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
