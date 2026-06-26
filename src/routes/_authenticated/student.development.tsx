import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileDown, Star, ChevronDown, ChevronRight } from "lucide-react";
import {
  DEV_CATEGORIES, type DevRecord, type CategoryDetail,
  isRecordComplete, recordScore, scoreForRating, requiredYears, developmentProgress,
} from "@/lib/development";
import { DevelopmentReport } from "@/components/tsid/development-report";
import { FieldAttachmentPanel } from "@/components/tsid/field-attachment-panel";
import { isTertiary } from "@/lib/development";

export const Route = createFileRoute("/_authenticated/student/development")({ component: Page });

function Page() {
  const me = useCurrentUser();
  const [showReport, setShowReport] = useState(false);

  const { data: student } = useQuery({
    enabled: !!me.tsid,
    queryKey: ["my-student", me.tsid],
    queryFn: async () => (await supabase.from("students").select("*").eq("tsid", me.tsid!).maybeSingle()).data,
  });

  const { data: records = [] } = useQuery({
    enabled: !!me.tsid,
    queryKey: ["dev-records", me.tsid],
    queryFn: async () => (await supabase.from("student_development").select("*").eq("tsid", me.tsid!).order("year")).data ?? [],
  });

  const { data: fieldwork = [] } = useQuery({
    enabled: !!me.tsid,
    queryKey: ["field-attachments", me.tsid],
    queryFn: async () => (await supabase.from("field_attachments").select("*").eq("tsid", me.tsid!).order("year", { ascending: false })).data ?? [],
  });

  if (me.loading || !student) return null;

  const years = requiredYears({
    startYear: student.start_year, startLevel: student.start_level,
    currentLevel: student.level, schoolType: student.school_type, enrollmentDate: student.enrollment_date,
  });
  const progress = developmentProgress(records as DevRecord[], years);
  const sorted = [...records].reverse();

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-2xl bg-primary text-primary-foreground p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">Lifetime Record</div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>My Development</h1>
            <p className="text-sm opacity-80 mt-1">Your growth from {years[0] ?? "—"} to {years[years.length - 1] ?? "—"}, as recorded by your school.</p>
          </div>
          <Button variant="secondary" onClick={() => setShowReport(true)}>
            <FileDown className="h-4 w-4 mr-2" /> Download Report
          </Button>
        </div>

        {/* Progress + talent */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <Metric label="Completion" value={`${progress.percent}%`} />
          <Metric label="Avg Score" value={`${progress.avgScore}%`} />
          <Metric label="Years Recorded" value={`${progress.doneYears.length}/${years.length}`} />
          <Metric label="Talent" value={student.talent_primary ?? "—"} small />
        </div>
        <div className="h-2 rounded-full bg-white/20 overflow-hidden mt-4">
          <div className="h-full rounded-full" style={{ width: `${progress.percent}%`, background: progress.complete ? "#4ade80" : "#fbbf24" }} />
        </div>
      </div>

      {/* Talent card */}
      {(student.talent_primary || student.talent_secondary) && (
        <div className="rounded-2xl border bg-amber-50 border-amber-200 p-4">
          <div className="flex items-center gap-1.5 text-amber-900 font-semibold"><Star className="h-4 w-4 fill-amber-500 text-amber-500" /> Talent</div>
          <div className="mt-1">{[student.talent_primary, student.talent_secondary].filter(Boolean).join(" · ")}</div>
          {student.talent_notes && <div className="text-sm text-muted-foreground mt-1">{student.talent_notes}</div>}
        </div>
      )}

      {/* Records (read-only) */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30 font-semibold text-sm">Development History</div>
        <div className="divide-y">
          {sorted.length === 0 && <div className="p-10 text-center text-muted-foreground text-sm">No development records yet. Your school will add them.</div>}
          {sorted.map((r: any) => <ReadRecord key={r.id} rec={r} />)}
        </div>
      </div>

      {/* Field study / internship — tertiary only */}
      {isTertiary({ schoolType: student.school_type, level: student.level }) && (
        <div className="rounded-2xl border bg-card p-4">
          <FieldAttachmentPanel student={student} canEdit={false} />
        </div>
      )}

      {/* Missing years note */}
      {progress.missingYears.length > 0 && (
        <p className="text-xs text-muted-foreground">Years still to be recorded by your school: {progress.missingYears.join(", ")}</p>
      )}

      {/* Report dialog */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Development Report (CV)</DialogTitle></DialogHeader>
          <DevelopmentReport student={student} records={records as DevRecord[]} fieldwork={fieldwork} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Metric({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="rounded-xl bg-white/10 p-3">
      <div className={`font-bold ${small ? "text-sm" : "text-2xl"}`}>{value}</div>
      <div className="text-[11px] opacity-80 uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
}

function ReadRecord({ rec }: { rec: any }) {
  const [open, setOpen] = useState(false);
  const complete = isRecordComplete(rec);
  const score = recordScore(rec);
  return (
    <div>
      <div className="px-4 py-3 flex items-center justify-between gap-2 cursor-pointer hover:bg-muted/20" onClick={() => setOpen((o) => !o)}>
        <div className="flex items-center gap-2 min-w-0">
          {open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
          <span className="font-semibold">{rec.year} · {rec.term}</span>
          {rec.level && <span className="text-xs text-muted-foreground">{rec.level}</span>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {score > 0 && <span className="text-sm font-bold" style={{ color: score >= 75 ? "#16a34a" : score >= 50 ? "#d97706" : "#dc2626" }}>{score}%</span>}
          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: complete ? "#dcfce7" : "#fef3c7", color: complete ? "#166534" : "#92400e" }}>
            {complete ? "Complete" : "In progress"}
          </span>
        </div>
      </div>
      {open && (
        <div className="px-4 pb-4 space-y-2.5 bg-muted/10">
          {DEV_CATEGORIES.map((c) => {
            const d: CategoryDetail = rec[c.detail] ?? {};
            return (
              <div key={c.key}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{c.label}</span>
                  {d.rating && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#eef2ff", color: "#3730a3" }}>{d.rating} · {d.score ?? scoreForRating(d.rating)}%</span>}
                </div>
                <div className="text-sm">{d.comment?.trim() ? d.comment : <span className="text-muted-foreground italic">—</span>}</div>
              </div>
            );
          })}
          {rec.talent_area && (
            <div className="pt-1 border-t">
              <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide flex items-center gap-1"><Star className="h-3 w-3" /> Talent</span>
              <div className="text-sm">{rec.talent_area}{rec.talent_remark ? ` — ${rec.talent_remark}` : ""}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
