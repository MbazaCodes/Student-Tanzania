import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyStudents } from "./teacher.index";
import { FileText, Clock, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/teacher/requests")({ component: Page });

function Page() {
  const { data: students = [] } = useMyStudents();
  const { data: requests = [] } = useQuery({
    enabled: students.length > 0,
    queryKey: ["teacher-requests", students.map((s: any) => s.tsid).join(",")],
    queryFn: async () => {
      const tsids = students.map((s: any) => s.tsid);
      if (!tsids.length) return [];
      return (await supabase.from("letter_requests").select("*").in("tsid", tsids).order("created_at", { ascending: false })).data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>Requests</h1>
        <p className="text-sm text-muted-foreground">Letter & document requests from your students.</p></div>
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30 font-semibold text-sm">Class Requests</div>
        <div className="divide-y">
          {requests.length === 0 && <div className="p-10 text-center text-muted-foreground text-sm">No requests.</div>}
          {requests.map((r: any) => (
            <div key={r.id} className="p-4 flex items-start justify-between gap-4">
              <div><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /><span className="font-semibold">{r.purpose}</span></div>
                <div className="text-xs text-muted-foreground mt-0.5">{r.student_name} · {r.tsid}</div></div>
              <Badge status={r.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
function Badge({ status }: { status: string }) {
  const m: Record<string, any> = { pending: { i: Clock, c: "#92400e", b: "#fef3c7" }, approved: { i: CheckCircle2, c: "#166534", b: "#dcfce7" }, rejected: { i: XCircle, c: "#991b1b", b: "#fee2e2" } };
  const x = m[status] ?? m.pending;
  return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full capitalize" style={{ background: x.b, color: x.c }}><x.i className="h-3 w-3" /> {status}</span>;
}
