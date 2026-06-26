import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Check, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import {
  DEV_CATEGORIES, DEV_TERMS, type DevRecord, type DevKey,
  isRecordComplete, filledCount, requiredYears, developmentProgress,
} from "@/lib/development";

export function DevelopmentPanel({ student, canEdit }: { student: any; canEdit: boolean }) {
  const me = useCurrentUser();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const { data: records = [] } = useQuery({
    enabled: !!student?.tsid,
    queryKey: ["dev-records", student?.tsid],
    queryFn: async () => (await supabase.from("student_development")
      .select("*").eq("tsid", student.tsid).order("year", { ascending: true }).order("term")).data ?? [],
  });

  const years = requiredYears({
    startYear: student.start_year, startLevel: student.start_level,
    currentLevel: student.level, schoolType: student.school_type, enrollmentDate: student.enrollment_date,
  });
  const progress = developmentProgress(records as DevRecord[], years);

  return (
    <div className="space-y-3">
      {/* Progress summary */}
      <div className="rounded-xl border bg-card p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">Development Progress</span>
          <span className="font-bold" style={{ color: progress.complete ? "#16a34a" : "#d97706" }}>{progress.percent}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted mt-2 overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${progress.percent}%`, background: progress.complete ? "#16a34a" : "#f59e0b" }} />
        </div>
        {progress.missingYears.length > 0 && (
          <div className="text-[11px] text-muted-foreground mt-1.5">
            Missing / incomplete years: {progress.missingYears.join(", ")}
          </div>
        )}
      </div>

      {/* Add button (school/gov only) */}
      {canEdit && !adding && !editId && (
        <Button size="sm" variant="outline" className="w-full" onClick={() => setAdding(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Development Record
        </Button>
      )}

      {/* Add / edit form */}
      {canEdit && (adding || editId) && (
        <DevForm
          student={student}
          existing={editId ? (records as DevRecord[]).find((r) => r.id === editId) : undefined}
          requiredYears={years}
          onDone={() => { setAdding(false); setEditId(null); qc.invalidateQueries({ queryKey: ["dev-records", student.tsid] }); }}
          onCancel={() => { setAdding(false); setEditId(null); }}
        />
      )}

      {/* Records list (newest first for display) */}
      <div className="space-y-2">
        {records.length === 0 && <div className="text-xs text-muted-foreground text-center py-4">No development records yet.</div>}
        {[...records].reverse().map((r: any) => (
          <RecordCard key={r.id} rec={r} canEdit={canEdit}
            onEdit={() => setEditId(r.id)}
            onDelete={async () => {
              if (!confirm(`Delete ${r.year} ${r.term} record?`)) return;
              const { error } = await supabase.from("student_development").delete().eq("id", r.id);
              if (error) { toast.error(error.message); return; }
              toast.success("Deleted");
              qc.invalidateQueries({ queryKey: ["dev-records", student.tsid] });
            }} />
        ))}
      </div>
    </div>
  );
}

function RecordCard({ rec, canEdit, onEdit, onDelete }: { rec: any; canEdit: boolean; onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const complete = isRecordComplete(rec);
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-3 py-2 flex items-center justify-between gap-2 cursor-pointer hover:bg-muted/30" onClick={() => setOpen((o) => !o)}>
        <div className="flex items-center gap-2 min-w-0">
          {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
          <span className="font-semibold text-sm">{rec.year} · {rec.term}</span>
          {rec.level && <span className="text-[11px] text-muted-foreground">{rec.level}</span>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
            style={{ background: complete ? "#dcfce7" : "#fef3c7", color: complete ? "#166534" : "#92400e" }}>
            {complete ? "Complete" : `${filledCount(rec)}/6`}
          </span>
          {canEdit && (
            <>
              <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1 hover:bg-muted rounded"><Pencil className="h-3 w-3" /></button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 hover:bg-muted rounded text-red-600"><Trash2 className="h-3 w-3" /></button>
            </>
          )}
        </div>
      </div>
      {open && (
        <div className="px-3 pb-3 pt-1 space-y-2 border-t">
          {DEV_CATEGORIES.map((c) => (
            <div key={c.key}>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{c.label}</div>
              <div className="text-sm">{rec[c.key]?.trim() ? rec[c.key] : <span className="text-muted-foreground italic">—</span>}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DevForm({ student, existing, requiredYears: years, onDone, onCancel }: {
  student: any; existing?: DevRecord; requiredYears: number[];
  onDone: () => void; onCancel: () => void;
}) {
  const me = useCurrentUser();
  const now = new Date().getFullYear();
  const yearOptions = years.length ? years : [now];
  const [year, setYear] = useState<number>(existing?.year ?? yearOptions[yearOptions.length - 1]);
  const [term, setTerm] = useState<string>(existing?.term ?? "Annual");
  const [level, setLevel] = useState<string>(existing?.level ?? student.level ?? "");
  const [vals, setVals] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    DEV_CATEGORIES.forEach((c) => { init[c.key] = (existing?.[c.key as DevKey] as string) ?? ""; });
    return init;
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const row: any = {
      tsid: student.tsid, school_code: student.school_code,
      year, term, level: level || null,
      created_by: me.userId, created_by_name: me.fullName ?? "School",
      updated_at: new Date().toISOString(),
    };
    DEV_CATEGORIES.forEach((c) => { row[c.key] = vals[c.key]?.trim() || null; });

    let error;
    if (existing?.id) {
      ({ error } = await supabase.from("student_development").update(row).eq("id", existing.id));
    } else {
      // upsert on (tsid, year, term)
      ({ error } = await supabase.from("student_development").upsert(row, { onConflict: "tsid,year,term" }));
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    onDone();
  }

  return (
    <div className="rounded-xl border bg-muted/20 p-3 space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Year</Label>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>{yearOptions.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Term</Label>
          <Select value={term} onValueChange={setTerm}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>{DEV_TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Class</Label>
          <Input className="h-9" value={level} onChange={(e) => setLevel(e.target.value)} placeholder="e.g. Standard 3" />
        </div>
      </div>

      {DEV_CATEGORIES.map((c) => (
        <div key={c.key} className="space-y-1">
          <Label className="text-xs">{c.label} *</Label>
          <textarea
            className="w-full rounded-md border px-3 py-2 text-sm min-h-[60px] bg-background"
            value={vals[c.key]}
            onChange={(e) => setVals((v) => ({ ...v, [c.key]: e.target.value }))}
            placeholder={`Enter ${c.label.toLowerCase()}`}
          />
        </div>
      ))}

      <div className="flex gap-2">
        <Button size="sm" className="flex-1 bg-primary" onClick={save} disabled={saving}>
          <Check className="h-3.5 w-3.5 mr-1" /> {saving ? "Saving…" : "Save Record"}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
      <p className="text-[11px] text-muted-foreground">Fill all 6 categories for this year to count toward 100% progress.</p>
    </div>
  );
}
