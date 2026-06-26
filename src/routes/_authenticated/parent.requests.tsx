import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useMyChildren } from "./parent.index";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, FileText, Clock, CheckCircle2, XCircle } from "lucide-react";
import { feeForStudent } from "@/lib/letter-requests";

export const Route = createFileRoute("/_authenticated/parent/requests")({ component: Page });

const REQUEST_TYPES = [
  "Confirmation Letter", "ID Card (Replacement)", "Relocation / Transfer", "Grant / Fund Application", "Other",
];

function Page() {
  const me = useCurrentUser();
  const qc = useQueryClient();
  const { data: children = [] } = useMyChildren();
  const [open, setOpen] = useState(false);

  const { data: requests = [] } = useQuery({
    enabled: children.length > 0,
    queryKey: ["parent-requests", children.map((c: any) => c.tsid).join(",")],
    queryFn: async () => {
      const tsids = children.map((c: any) => c.tsid);
      if (!tsids.length) return [];
      return (await supabase.from("letter_requests").select("*").in("tsid", tsids).order("created_at", { ascending: false })).data ?? [];
    },
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-primary text-primary-foreground p-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">Requests</div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Submit a Request</h1>
          <p className="text-sm opacity-80 mt-1">Letters, ID, transfer, grants & funds for your children.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="secondary" disabled={!children.length}><Plus className="h-4 w-4 mr-2" /> New Request</Button></DialogTrigger>
          <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto">
            <DialogHeader><DialogTitle>New Request</DialogTitle></DialogHeader>
            <RequestForm me={me} children={children} onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["parent-requests"] }); }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30 font-semibold text-sm">My Requests</div>
        <div className="divide-y">
          {requests.length === 0 && <div className="p-10 text-center text-muted-foreground text-sm">No requests yet.</div>}
          {requests.map((r: any) => (
            <div key={r.id} className="p-4 flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /><span className="font-semibold">{r.purpose}</span></div>
                <div className="text-xs text-muted-foreground mt-0.5">{r.student_name} · {r.tsid}</div>
                {r.reason && <div className="text-xs text-muted-foreground">{r.reason}</div>}
              </div>
              <StatusBadge status={r.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const m: Record<string, any> = {
    pending: { icon: Clock, c: "#92400e", b: "#fef3c7" },
    approved: { icon: CheckCircle2, c: "#166534", b: "#dcfce7" },
    rejected: { icon: XCircle, c: "#991b1b", b: "#fee2e2" },
  };
  const x = m[status] ?? m.pending;
  return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full capitalize" style={{ background: x.b, color: x.c }}><x.icon className="h-3 w-3" /> {status}</span>;
}

function RequestForm({ me, children, onDone }: { me: any; children: any[]; onDone: () => void }) {
  const [tsid, setTsid] = useState(children[0]?.tsid ?? "");
  const [type, setType] = useState(REQUEST_TYPES[0]);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const child = children.find((c: any) => c.tsid === tsid);

  async function submit() {
    if (!child) { toast.error("Select a child"); return; }
    if (!reason.trim()) { toast.error("Enter a reason"); return; }
    setLoading(true);
    const fee = feeForStudent(child.disability, child.school_fee_exempt);
    const { error } = await supabase.from("letter_requests").insert({
      tsid: child.tsid, student_name: child.fullname,
      school_code: child.school_code, school_name: child.school_name,
      sector: "government", purpose: type, reason,
      region: child.region ?? null, district: child.district ?? null,
      fee_type: fee.fee_type, amount: fee.amount, paid: fee.exempt,
      paid_at: fee.exempt ? new Date().toISOString() : null,
      status: "pending",
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Request submitted to the school");
    onDone();
  }

  return (
    <div className="space-y-3 py-1">
      <div className="space-y-1.5"><Label>Child</Label>
        <Select value={tsid} onValueChange={setTsid}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{children.map((c: any) => <SelectItem key={c.tsid} value={c.tsid}>{c.fullname}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5"><Label>Request Type</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{REQUEST_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5"><Label>Reason / Details</Label>
        <textarea className="w-full rounded-md border px-3 py-2 text-sm min-h-[64px] bg-background" value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>
      <Button className="w-full bg-primary" onClick={submit} disabled={loading}>{loading ? "Submitting…" : "Submit Request"}</Button>
    </div>
  );
}
