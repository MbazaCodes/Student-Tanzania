import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyStudents } from "./teacher.index";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, FileBarChart } from "lucide-react";
import { DevelopmentReport } from "@/components/tsid/development-report";
import type { DevRecord } from "@/lib/development";

export const Route = createFileRoute("/_authenticated/teacher/reports")({ component: Page });

function Page() {
  const { data: students = [] } = useMyStudents();
  const [q, setQ] = useState("");
  const [tsid, setTsid] = useState<string | null>(null);
  const filtered = students.filter((s: any) => !q || s.fullname.toLowerCase().includes(q.toLowerCase()) || s.tsid.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>Reports</h1>
        <p className="text-sm text-muted-foreground">Generate development reports for your students.</p></div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search name or TSID" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {filtered.length === 0 && <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground text-sm col-span-2">No students.</div>}
        {filtered.map((s: any) => (
          <div key={s.tsid} className="rounded-2xl border bg-card p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl overflow-hidden bg-muted border shrink-0 flex items-center justify-center">
              {s.photo ? <img src={s.photo} alt="" className="h-full w-full object-cover" /> : <span>👤</span>}
            </div>
            <div className="min-w-0 flex-1"><div className="font-semibold truncate">{s.fullname}</div><div className="text-xs text-muted-foreground">{s.level}</div></div>
            <Button size="sm" variant="outline" onClick={() => setTsid(s.tsid)}><FileBarChart className="h-3.5 w-3.5 mr-1" /> Report</Button>
          </div>
        ))}
      </div>
      <Dialog open={!!tsid} onOpenChange={(o) => !o && setTsid(null)}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Development Report</DialogTitle></DialogHeader>
          {tsid && <Loader tsid={tsid} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Loader({ tsid }: { tsid: string }) {
  const { data: student } = useQuery({ queryKey: ["t-child", tsid], queryFn: async () => (await supabase.from("students").select("*").eq("tsid", tsid).maybeSingle()).data });
  const { data: records = [] } = useQuery({ queryKey: ["t-dev", tsid], queryFn: async () => (await supabase.from("student_development").select("*").eq("tsid", tsid).order("year")).data ?? [] });
  const { data: fieldwork = [] } = useQuery({ queryKey: ["t-fa", tsid], queryFn: async () => (await supabase.from("field_attachments").select("*").eq("tsid", tsid)).data ?? [] });
  if (!student) return <div className="py-8 text-center text-muted-foreground text-sm">Loading…</div>;
  return <DevelopmentReport student={student} records={records as DevRecord[]} fieldwork={fieldwork} />;
}
