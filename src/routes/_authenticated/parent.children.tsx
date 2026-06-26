import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useMyChildren } from "./parent.index";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star, ChevronDown, ChevronRight, FileDown, Accessibility } from "lucide-react";
import {
  DEV_CATEGORIES, type DevRecord, type CategoryDetail,
  isRecordComplete, recordScore, scoreForRating, requiredYears, developmentProgress,
} from "@/lib/development";
import { DevelopmentReport } from "@/components/tsid/development-report";

export const Route = createFileRoute("/_authenticated/parent/children")({ component: Page });

function Page() {
  const { data: children = [] } = useMyChildren();
  const [active, setActive] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>My Children</h1>
        <p className="text-sm text-muted-foreground">Your children's profiles, results, remarks, and development.</p>
      </div>

      {children.length === 0 && <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground text-sm">No children linked. Contact your school.</div>}

      <div className="grid sm:grid-cols-2 gap-4">
        {children.map((c: any) => (
          <button key={c.tsid} onClick={() => setActive(c.tsid)} className="rounded-2xl border bg-card p-4 flex items-center gap-3 text-left hover:shadow-md transition">
            <div className="h-16 w-16 rounded-xl overflow-hidden bg-muted border shrink-0 flex items-center justify-center">
              {c.photo ? <img src={c.photo} alt="" className="h-full w-full object-cover" /> : <span className="text-2xl">👤</span>}
            </div>
            <div className="min-w-0">
              <div className="font-bold truncate">{c.fullname}</div>
              <div className="font-mono text-xs text-muted-foreground">{c.tsid}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{c.level} · {c.school_name}</div>
            </div>
          </button>
        ))}
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          {active && <ChildDetail tsid={active} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ChildDetail({ tsid }: { tsid: string }) {
  const [showReport, setShowReport] = useState(false);

  const { data: student } = useQuery({
    queryKey: ["child", tsid],
    queryFn: async () => (await supabase.from("students").select("*").eq("tsid", tsid).maybeSingle()).data,
  });
  const { data: records = [] } = useQuery({
    queryKey: ["child-dev", tsid],
    queryFn: async () => (await supabase.from("student_development").select("*").eq("tsid", tsid).order("year")).data ?? [],
  });
  const { data: fieldwork = [] } = useQuery({
    queryKey: ["child-fa", tsid],
    queryFn: async () => (await supabase.from("field_attachments").select("*").eq("tsid", tsid).order("year", { ascending: false })).data ?? [],
  });

  if (!student) return <div className="py-8 text-center text-muted-foreground text-sm">Loading…</div>;

  const years = requiredYears({
    startYear: student.start_year, startLevel: student.start_level,
    currentLevel: student.level, schoolType: student.school_type, enrollmentDate: student.enrollment_date,
  });
  const progress = developmentProgress(records as DevRecord[], years);

  return (
    <div className="space-y-4">
      <DialogHeader><DialogTitle>{student.fullname}</DialogTitle></DialogHeader>

      <div className="flex items-start gap-4">
        <div className="h-24 w-24 rounded-2xl overflow-hidden bg-muted border shrink-0 flex items-center justify-center">
          {student.photo ? <img src={student.photo} alt="" className="h-full w-full object-cover" /> : <span className="text-3xl">👤</span>}
        </div>
        <div className="text-sm space-y-0.5">
          <div className="font-mono text-xs text-muted-foreground">{student.tsid}</div>
          <div><strong>Class:</strong> {student.level ?? "—"}</div>
          <div><strong>School:</strong> {student.school_name ?? "—"}</div>
          <div><strong>Status:</strong> <span className="capitalize">{student.status ?? "active"}</span></div>
          {student.talent_primary && <div className="flex items-center gap-1 text-amber-700"><Star className="h-3 w-3 fill-amber-500 text-amber-500" /> {student.talent_primary}{student.talent_secondary ? ` · ${student.talent_secondary}` : ""}</div>}
        </div>
      </div>

      {/* Development progress */}
      <div className="rounded-xl border bg-card p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">Development</span>
          <span className="font-bold" style={{ color: progress.complete ? "#16a34a" : "#d97706" }}>{progress.avgScore}% avg · {progress.percent}% complete</span>
        </div>
        <div className="h-2 rounded-full bg-muted mt-2 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${progress.percent}%`, background: progress.complete ? "#16a34a" : "#f59e0b" }} />
        </div>
      </div>

      {/* Records read-only */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Results & Remarks</div>
        {records.length === 0 && <div className="text-xs text-muted-foreground">No records yet.</div>}
        {[...records].reverse().map((r: any) => <ReadRecord key={r.id} rec={r} />)}
      </div>

      <Button className="w-full bg-primary" onClick={() => setShowReport(true)}>
        <FileDown className="h-4 w-4 mr-2" /> Download Development Report (CV)
      </Button>

      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Development Report</DialogTitle></DialogHeader>
          <DevelopmentReport student={student} records={records as DevRecord[]} fieldwork={fieldwork} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReadRecord({ rec }: { rec: any }) {
  const [open, setOpen] = useState(false);
  const complete = isRecordComplete(rec);
  const score = recordScore(rec);
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-3 py-2 flex items-center justify-between gap-2 cursor-pointer hover:bg-muted/30" onClick={() => setOpen((o) => !o)}>
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          <span className="font-semibold text-sm">{rec.year} · {rec.term}</span>
          {rec.level && <span className="text-[11px] text-muted-foreground">{rec.level}</span>}
        </div>
        {score > 0 && <span className="text-sm font-bold" style={{ color: score >= 75 ? "#16a34a" : score >= 50 ? "#d97706" : "#dc2626" }}>{score}%</span>}
      </div>
      {open && (
        <div className="px-3 pb-3 pt-1 space-y-2 border-t">
          {DEV_CATEGORIES.map((c) => {
            const d: CategoryDetail = rec[c.detail] ?? {};
            return (
              <div key={c.key}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">{c.label}</span>
                  {d.rating && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#eef2ff", color: "#3730a3" }}>{d.rating} · {d.score ?? scoreForRating(d.rating)}%</span>}
                </div>
                <div className="text-sm">{d.comment?.trim() ? d.comment : <span className="text-muted-foreground italic">—</span>}</div>
              </div>
            );
          })}
          {rec.talent_area && <div className="text-sm text-amber-700"><Star className="h-3 w-3 inline" /> {rec.talent_area}{rec.talent_remark ? ` — ${rec.talent_remark}` : ""}</div>}
        </div>
      )}
    </div>
  );
}
