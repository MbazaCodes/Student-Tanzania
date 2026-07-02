import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Check, Pencil, Trash2, ChevronDown, ChevronRight, Star } from "lucide-react";
import {
  DEV_CATEGORIES, DEV_TERMS, DEV_RATINGS, TALENT_AREAS, type DevRecord, type CategoryDetail,
  isRecordComplete, filledCount, recordScore, scoreForRating, requiredYears, developmentProgress,
} from "@/lib/development";

export function DevelopmentPanel({ student, canEdit }: { student: any; canEdit: boolean }) {
  const qc = useQueryClient();
  const me = useCurrentUser();
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
      {/* Talent (lifetime, on the student record) */}
      {canEdit ? <TalentEditor student={student} /> : (
        (student.talent_primary || student.talent_secondary) && (
          <div className="rounded-xl border bg-amber-50 border-amber-200 p-3">
            <div className="flex items-center gap-1.5 text-amber-900 font-semibold text-sm"><Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> Talent</div>
            <div className="text-sm mt-1">{[student.talent_primary, student.talent_secondary].filter(Boolean).join(" · ")}</div>
            {student.talent_notes && <div className="text-xs text-muted-foreground mt-0.5">{student.talent_notes}</div>}
          </div>
        )
      )}

      {/* Progress summary */}
      <div className="rounded-xl border bg-card p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">Development Progress</span>
          <span className="font-bold" style={{ color: progress.complete ? "#16a34a" : "#d97706" }}>{progress.percent}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted mt-2 overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${progress.percent}%`, background: progress.complete ? "#16a34a" : "#f59e0b" }} />
        </div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1.5">
          <span>Avg development score: <strong>{progress.avgScore}%</strong></span>
          <span>{progress.doneYears.length}/{years.length} years</span>
        </div>
        {progress.missingYears.length > 0 && (
          <div className="text-[11px] text-amber-600 mt-1">Missing/incomplete: {progress.missingYears.join(", ")}</div>
        )}
      </div>

      {canEdit && !adding && !editId && (
        <Button size="sm" variant="outline" className="w-full" onClick={() => setAdding(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Yearly Record
        </Button>
      )}

      {canEdit && (adding || editId) && (
        <DevForm
          student={student}
          existing={editId ? (records as any[]).find((r) => r.id === editId) : undefined}
          yearOptions={years}
          onDone={() => { setAdding(false); setEditId(null); qc.invalidateQueries({ queryKey: ["dev-records", student.tsid] }); }}
          onCancel={() => { setAdding(false); setEditId(null); }}
        />
      )}

      <div className="space-y-2">
        {records.length === 0 && <div className="text-xs text-muted-foreground text-center py-4">No development records yet.</div>}
        {[...records].reverse().map((r: any) => (
          <RecordCard key={r.id} rec={r} canEdit={canEdit}
            onEdit={() => setEditId(r.id)}
            onDelete={async () => {
              if (!confirm(`Delete ${r.year} ${r.term} record?`)) return;
              const { error } = await supabase.from("student_development").delete().eq("id", r.id);
              if (error) { toast.error(error.message); return; }
              await supabase.from("development_audit").insert({
                tsid: student.tsid, record_id: r.id, school_code: student.school_code,
                action: "delete", year: r.year, term: r.term,
                changes: r, actor_uid: me.userId, actor_name: me.fullName ?? "School", actor_role: me.role ?? "school",
              });
              toast.success("Deleted");
              qc.invalidateQueries({ queryKey: ["dev-records", student.tsid] });
            }} />
        ))}
      </div>

      {canEdit && <AuditTrail tsid={student.tsid} />}
    </div>
  );
}

function AuditTrail({ tsid }: { tsid: string }) {
  const [open, setOpen] = useState(false);
  const { data: logs = [] } = useQuery({
    enabled: open,
    queryKey: ["dev-audit", tsid],
    queryFn: async () => (await supabase.from("development_audit").select("*").eq("tsid", tsid).order("created_at", { ascending: false }).limit(50)).data ?? [],
  });
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full px-3 py-2 flex items-center justify-between text-xs font-semibold text-muted-foreground hover:bg-muted/30">
        <span>🕓 Audit Trail (who changed what)</span>
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>
      {open && (
        <div className="divide-y max-h-60 overflow-y-auto">
          {logs.length === 0 && <div className="px-3 py-3 text-xs text-muted-foreground text-center">No changes logged yet.</div>}
          {logs.map((l: any) => (
            <div key={l.id} className="px-3 py-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold capitalize" style={{ color: l.action === "delete" ? "#dc2626" : l.action === "create" ? "#16a34a" : "#d97706" }}>{l.action}</span>
                <span className="text-muted-foreground">{new Date(l.created_at).toLocaleString()}</span>
              </div>
              <div className="text-muted-foreground">{l.year} {l.term} · by {l.actor_name} ({l.actor_role})</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TalentEditor({ student }: { student: any }) {
  const qc = useQueryClient();
  const [primary, setPrimary] = useState(student.talent_primary ?? "");
  const [secondary, setSecondary] = useState(student.talent_secondary ?? "");
  const [notes, setNotes] = useState(student.talent_notes ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("students")
      .update({ talent_primary: primary || null, talent_secondary: secondary || null, talent_notes: notes || null })
      .eq("tsid", student.tsid);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Talent saved");
    qc.invalidateQueries({ queryKey: ["my-student"] });
    qc.invalidateQueries({ queryKey: ["student-profile", student.tsid] });
  }

  return (
    <div className="rounded-xl border bg-amber-50/50 border-amber-200 p-3 space-y-2">
      <div className="flex items-center gap-1.5 text-amber-900 font-semibold text-sm"><Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> Talent — what is this student best at?</div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Primary Talent</Label>
          <Select value={primary} onValueChange={setPrimary}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{TALENT_AREAS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Secondary Talent</Label>
          <Select value={secondary} onValueChange={setSecondary}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{TALENT_AREAS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">How it's being developed</Label>
        <textarea className="w-full rounded-md border px-3 py-2 text-sm min-h-[48px] bg-background" value={notes}
          onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Joined the school football team; recommended for district trials." />
      </div>
      <Button size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={save} disabled={saving}>
        <Check className="h-3.5 w-3.5 mr-1" /> {saving ? "Saving…" : "Save Talent"}
      </Button>
    </div>
  );
}

function RecordCard({ rec, canEdit, onEdit, onDelete }: { rec: any; canEdit: boolean; onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const complete = isRecordComplete(rec);
  const score = recordScore(rec);
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-3 py-2 flex items-center justify-between gap-2 cursor-pointer hover:bg-muted/30" onClick={() => setOpen((o) => !o)}>
        <div className="flex items-center gap-2 min-w-0">
          {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
          <span className="font-semibold text-sm">{rec.year} · {rec.term}</span>
          {rec.level && <span className="text-[11px] text-muted-foreground">{rec.level}</span>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {score > 0 && <span className="text-[11px] font-bold" style={{ color: score >= 75 ? "#16a34a" : score >= 50 ? "#d97706" : "#dc2626" }}>{score}%</span>}
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
        <div className="px-3 pb-3 pt-1 space-y-2.5 border-t">
          {DEV_CATEGORIES.map((c) => {
            const d: CategoryDetail = rec[c.detail] ?? {};
            return (
              <div key={c.key}>
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{c.label}</div>
                  {d.rating && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#eef2ff", color: "#3730a3" }}>
                      {d.rating} · {d.score ?? scoreForRating(d.rating)}%
                    </span>
                  )}
                </div>
                <div className="text-sm">{d.comment?.trim() ? d.comment : <span className="text-muted-foreground italic">—</span>}</div>
              </div>
            );
          })}
          {rec.talent_area && (
            <div className="pt-1 border-t">
              <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide flex items-center gap-1"><Star className="h-3 w-3" /> Talent</div>
              <div className="text-sm">{rec.talent_area}{rec.talent_remark ? ` — ${rec.talent_remark}` : ""}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DevForm({ student, existing, yearOptions, onDone, onCancel }: {
  student: any; existing?: any; yearOptions: number[];
  onDone: () => void; onCancel: () => void;
}) {
  const me = useCurrentUser();
  const now = new Date().getFullYear();
  const yrs = yearOptions.length ? yearOptions : [now];
  const [year, setYear] = useState<number>(existing?.year ?? yrs[yrs.length - 1]);
  const [term, setTerm] = useState<string>(existing?.term ?? "Annual");
  const [level, setLevel] = useState<string>(existing?.level ?? student.level ?? "");
  const [talentArea, setTalentArea] = useState<string>(existing?.talent_area ?? "");
  const [talentRemark, setTalentRemark] = useState<string>(existing?.talent_remark ?? "");
  const [details, setDetails] = useState<Record<string, CategoryDetail>>(() => {
    const init: Record<string, CategoryDetail> = {};
    DEV_CATEGORIES.forEach((c) => { init[c.key] = existing?.[c.detail] ?? {}; });
    return init;
  });
  const [saving, setSaving] = useState(false);

  function setCat(key: string, patch: Partial<CategoryDetail>) {
    setDetails((d) => ({ ...d, [key]: { ...d[key], ...patch } }));
  }

  async function save() {
    setSaving(true);
    const row: any = {
      tsid: student.tsid, school_code: student.school_code,
      year, term, level: level || null,
      talent_area: talentArea || null, talent_remark: talentRemark || null,
      created_by: me.userId, created_by_name: me.fullName ?? "School",
      updated_at: new Date().toISOString(),
    };
    DEV_CATEGORIES.forEach((c) => {
      const d = details[c.key] ?? {};
      row[c.detail] = {
        rating: d.rating ?? null,
        score: d.rating ? (d.score ?? scoreForRating(d.rating)) : null,
        comment: d.comment?.trim() || null,
      };
    });

    let error;
    if (existing?.id) {
      ({ error } = await supabase.from("student_development").update(row).eq("id", existing.id));
    } else {
      ({ error } = await supabase.from("student_development").upsert(row, { onConflict: "tsid,year,term" }));
    }
    setSaving(false);
    if (error) {
      toast.error(error.message);
      if (/row-level security/i.test(error.message)) {
        const { data: dbg } = await supabase.rpc("debug_teacher_access", { p_tsid: student.tsid });
        console.log("ACCESS DEBUG:", dbg);
        const a = dbg as any;
        if (a && !a.admin_row) toast.error("Diagnosis: your login has no admin_users row.");
        else if (a?.admin_row?.role === "teacher" && !a.can_access)
          toast.error(`Diagnosis: no class assignment matches this student (student: ${a.student?.level ?? "?"} @ ${a.student?.school ?? "?"}; your classes: ${(a.assignments ?? []).map((x: any) => x.level).join(", ") || "none"}).`);
      }
      return;
    }
    // Append-only audit trail
    await supabase.from("development_audit").insert({
      tsid: student.tsid, record_id: existing?.id ?? null, school_code: student.school_code,
      action: existing?.id ? "update" : "create", year, term,
      changes: row, actor_uid: me.userId, actor_name: me.fullName ?? "School", actor_role: me.role ?? "school",
    });
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
            <SelectContent>{yrs.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
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

      {DEV_CATEGORIES.map((c) => {
        const d = details[c.key] ?? {};
        return (
          <div key={c.key} className="rounded-lg border bg-background p-2.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs font-semibold">{c.label} *</Label>
              <div className="flex items-center gap-1.5">
                <Select value={d.rating ?? ""} onValueChange={(v) => setCat(c.key, { rating: v, score: scoreForRating(v) })}>
                  <SelectTrigger className="h-7 w-[140px] text-xs"><SelectValue placeholder="Rating" /></SelectTrigger>
                  <SelectContent>{DEV_RATINGS.map((r) => <SelectItem key={r.value} value={r.value}>{r.value} ({r.score}%)</SelectItem>)}</SelectContent>
                </Select>
                <Input type="number" min={0} max={100} className="h-7 w-16 text-xs" value={d.score ?? ""} placeholder="%"
                  onChange={(e) => setCat(c.key, { score: e.target.value ? Number(e.target.value) : undefined })} />
              </div>
            </div>
            <textarea className="w-full rounded-md border px-3 py-2 text-sm min-h-[54px] bg-background"
              value={d.comment ?? ""} onChange={(e) => setCat(c.key, { comment: e.target.value })}
              placeholder="Why this score & how to improve — e.g. 'Score 75%: student observed smoking. Needs to stop nicotine use and declare cessation.'" />
          </div>
        );
      })}

      {/* Talent for this record */}
      <div className="rounded-lg border bg-amber-50/40 p-2.5 space-y-2">
        <Label className="text-xs font-semibold flex items-center gap-1"><Star className="h-3 w-3" /> Talent identified this year</Label>
        <Select value={talentArea} onValueChange={setTalentArea}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select talent" /></SelectTrigger>
          <SelectContent>{TALENT_AREAS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
        <Input className="h-8 text-xs" value={talentRemark} onChange={(e) => setTalentRemark(e.target.value)} placeholder="How it's nurtured / progress" />
      </div>

      <div className="flex gap-2">
        <Button size="sm" className="flex-1 bg-primary" onClick={save} disabled={saving}>
          <Check className="h-3.5 w-3.5 mr-1" /> {saving ? "Saving…" : "Save Record"}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
      <p className="text-[11px] text-muted-foreground">Give each category a rating + comment to mark the year complete (counts toward 100%).</p>
    </div>
  );
}
