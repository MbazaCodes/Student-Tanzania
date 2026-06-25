import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// xlsx is loaded lazily (only when bulk upload is actually used) so a missing
// or slow xlsx install never blocks the rest of the app from loading.
async function loadXLSX() {
  return await import("xlsx");
}

type Mode = "students" | "schools";

const TEMPLATES: Record<Mode, { headers: string[]; sample: Record<string, string> }> = {
  students: {
    headers: ["fullname", "dob", "gender", "level", "blood_group", "nationality", "parent_name", "parent_phone", "parent_nida", "relationship"],
    sample: {
      fullname: "Juma A. Mwanza", dob: "2014-05-15", gender: "Male",
      level: "Standard 4", blood_group: "O+", nationality: "Tanzanian",
      parent_name: "Aishatu Juma", parent_phone: "+255712345678",
      parent_nida: "19900123456789", relationship: "Mother",
    },
  },
  schools: {
    headers: ["school_name", "type", "region", "district", "ward", "address", "phone", "email"],
    sample: {
      school_name: "Mwanza Primary School", type: "Primary School",
      region: "Mwanza", district: "Ilemela MC", ward: "Pasiansi",
      address: "P.O. Box 123", phone: "+255712000111", email: "school@example.com",
    },
  },
};

/**
 * Bulk upload via CSV or Excel. Calls a provided onRows handler that performs
 * the actual per-row creation (so scope/auth-account logic is reused).
 */
export function BulkUpload({ mode, onRows }: {
  mode: Mode;
  onRows: (rows: Record<string, string>[]) => Promise<{ ok: number; failed: number; errors: string[] }>;
}) {
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<{ ok: number; failed: number; errors: string[] } | null>(null);
  const tpl = TEMPLATES[mode];

  async function downloadTemplate(fmt: "csv" | "xlsx") {
    const XLSX = await loadXLSX();
    const ws = XLSX.utils.json_to_sheet([tpl.sample], { header: tpl.headers });
    if (fmt === "csv") {
      const csv = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csv], { type: "text/csv" });
      triggerDownload(blob, `${mode}-template.csv`);
    } else {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, mode);
      const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      triggerDownload(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${mode}-template.xlsx`);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    setResult(null);
    try {
      const XLSX = await loadXLSX();
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });
      if (rows.length === 0) { toast.error("No rows found in file."); setParsing(false); return; }
      // Validate headers
      const missing = tpl.headers.filter((h) => !(h in rows[0]));
      if (missing.length > 0) {
        toast.error(`Missing columns: ${missing.join(", ")}`);
        setParsing(false);
        return;
      }
      const res = await onRows(rows);
      setResult(res);
      if (res.ok > 0) toast.success(`${res.ok} ${mode} imported`);
      if (res.failed > 0) toast.error(`${res.failed} rows failed`);
    } catch (err) {
      toast.error(`Parse error: ${String(err)}`);
    }
    setParsing(false);
    e.target.value = "";
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-5">
        <div className="flex items-center gap-2 font-semibold text-sm text-primary mb-2">
          <FileSpreadsheet className="h-4 w-4" /> Bulk upload {mode}
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Download a template, fill it in, then upload. CSV and Excel (.xlsx) are both supported.
        </p>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => downloadTemplate("csv")}>
            <Download className="h-3.5 w-3.5 mr-1" /> CSV template
          </Button>
          <Button size="sm" variant="outline" onClick={() => downloadTemplate("xlsx")}>
            <Download className="h-3.5 w-3.5 mr-1" /> Excel template
          </Button>
          <label className="inline-flex">
            <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} className="hidden" disabled={parsing} />
            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${parsing ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground hover:opacity-90"}`}>
              <Upload className="h-3.5 w-3.5" /> {parsing ? "Importing…" : "Upload file"}
            </span>
          </label>
        </div>
      </div>

      {result && (
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Imported: {result.ok}
            {result.failed > 0 && <><AlertCircle className="h-4 w-4 text-red-600 ml-3" /> Failed: {result.failed}</>}
          </div>
          {result.errors.length > 0 && (
            <ul className="text-xs text-red-600 space-y-0.5 max-h-40 overflow-y-auto">
              {result.errors.slice(0, 20).map((er, i) => <li key={i}>• {er}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
