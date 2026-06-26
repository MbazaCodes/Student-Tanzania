import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyChildren } from "./parent.index";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileBarChart, FileDown } from "lucide-react";
import { DevelopmentReport } from "@/components/tsid/development-report";
import type { DevRecord } from "@/lib/development";

export const Route = createFileRoute("/_authenticated/parent/reports")({ component: Page });

function Page() {
  const { data: children = [] } = useMyChildren();
  const [reportTsid, setReportTsid] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>Reports</h1>
        <p className="text-sm text-muted-foreground">Generate and download development reports for your children.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {children.length === 0 && <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground text-sm col-span-2">No children linked.</div>}
        {children.map((c: any) => (
          <div key={c.tsid} className="rounded-2xl border bg-card p-4 flex items-center gap-3">
            <div className="h-14 w-14 rounded-xl overflow-hidden bg-muted border shrink-0 flex items-center justify-center">
              {c.photo ? <img src={c.photo} alt="" className="h-full w-full object-cover" /> : <span className="text-xl">👤</span>}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold truncate">{c.fullname}</div>
              <div className="text-xs text-muted-foreground">{c.level} · {c.school_name}</div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setReportTsid(c.tsid)}><FileBarChart className="h-3.5 w-3.5 mr-1" /> Report</Button>
          </div>
        ))}
      </div>

      <Dialog open={!!reportTsid} onOpenChange={(o) => !o && setReportTsid(null)}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Development Report</DialogTitle></DialogHeader>
          {reportTsid && <ReportLoader tsid={reportTsid} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReportLoader({ tsid }: { tsid: string }) {
  const { data: student } = useQuery({ queryKey: ["child", tsid], queryFn: async () => (await supabase.from("students").select("*").eq("tsid", tsid).maybeSingle()).data });
  const { data: records = [] } = useQuery({ queryKey: ["child-dev", tsid], queryFn: async () => (await supabase.from("student_development").select("*").eq("tsid", tsid).order("year")).data ?? [] });
  const { data: fieldwork = [] } = useQuery({ queryKey: ["child-fa", tsid], queryFn: async () => (await supabase.from("field_attachments").select("*").eq("tsid", tsid)).data ?? [] });
  if (!student) return <div className="py-8 text-center text-muted-foreground text-sm">Loading…</div>;
  return <DevelopmentReport student={student} records={records as DevRecord[]} fieldwork={fieldwork} />;
}
