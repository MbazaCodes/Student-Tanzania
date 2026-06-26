import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";
import { FileText, Check, X, Clock, Stamp as StampIcon } from "lucide-react";
import { generateLetterRef } from "@/lib/letter-requests";
import { SignaturePad } from "@/components/tsid/signature-pad";
import { PhotoUpload } from "@/components/tsid/photo-upload";

export const Route = createFileRoute("/_authenticated/school/letters")({ component: Page });

function Page() {
  const me = useCurrentUser();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [approving, setApproving] = useState<any | null>(null);
  const [approvePaid, setApprovePaid] = useState(false);

  // School's saved default signature + stamp (reusable)
  const { data: school } = useQuery({
    enabled: !!me.schoolCode,
    queryKey: ["school-marks", me.schoolCode],
    queryFn: async () => (await supabase.from("schools").select("signature,stamp").eq("school_code", me.schoolCode!).maybeSingle()).data,
  });

  const { data: requests = [] } = useQuery({
    enabled: !!me.schoolCode,
    queryKey: ["school-letters", me.schoolCode, filter],
    queryFn: async () => (await supabase.from("letter_requests")
      .select("*").eq("school_code", me.schoolCode!).eq("status", filter)
      .order("created_at", { ascending: false })).data ?? [],
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
    refetchInterval: 30000,
  });

  async function finalizeApprove(l: any, signature: string, stamp: string, paid: boolean) {
    const updates: any = {
      status: "approved", reviewer: me.userId, reviewer_name: me.fullName ?? "School",
      reviewed_at: new Date().toISOString(),
      ref_no: generateLetterRef(), signature, stamp, signed_by: me.fullName ?? "Head of School",
    };
    if (paid) updates.paid = true;
    const { error } = await supabase.from("letter_requests").update(updates).eq("id", l.id);
    if (error) { toast.error(error.message); return; }
    await supabase.from("activity_logs").insert({
      action: "letter:approved", message: `approved letter (${l.purpose}) for ${l.tsid}`,
      by_name: me.fullName ?? "School", by_role: "school", by_ref: l.tsid,
    });
    toast.success("Letter approved & signed");
    setApproving(null);
    qc.invalidateQueries({ queryKey: ["school-letters"] });
  }

  async function reject(l: any) {
    const { error } = await supabase.from("letter_requests").update({
      status: "rejected", reviewer: me.userId, reviewer_name: me.fullName ?? "School",
      reviewed_at: new Date().toISOString(),
    }).eq("id", l.id);
    if (error) { toast.error(error.message); return; }
    await supabase.from("activity_logs").insert({
      action: "letter:rejected", message: `rejected letter (${l.purpose}) for ${l.tsid}`,
      by_name: me.fullName ?? "School", by_role: "school", by_ref: l.tsid,
    });
    toast.success("Rejected");
    qc.invalidateQueries({ queryKey: ["school-letters"] });
  }

  function openApprove(l: any, paid: boolean) {
    setApprovePaid(paid);
    setApproving(l);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>Letter Requests</h1>
        <p className="text-sm text-muted-foreground">Review student letter requests. Sign and stamp to approve — the letter then becomes downloadable.</p>
      </div>

      <div className="flex gap-2">
        {(["pending", "approved", "rejected"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30 font-semibold text-sm flex items-center gap-2">
          <Clock className="h-4 w-4" /> {filter} ({requests.length})
        </div>
        <div className="divide-y">
          {requests.length === 0 && <div className="p-10 text-center text-muted-foreground text-sm">No {filter} requests.</div>}
          {requests.map((l: any) => (
            <div key={l.id} className="p-4 flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-semibold">{l.student_name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{l.tsid}</span>
                </div>
                <div className="text-sm mt-1">{l.purpose} <span className="text-xs text-muted-foreground">· {l.sector}</span></div>
                {l.reason && <div className="text-xs text-muted-foreground mt-0.5">{l.reason}</div>}
                {l.recipient_name && <div className="text-xs text-muted-foreground">To: {l.recipient_name}{l.district ? ` · ${l.district}, ${l.region}` : ""}</div>}
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  {l.fee_type === "free" ? (
                    <span className="inline-block text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: "#dbeafe", color: "#1e40af" }}>
                      FREE · EXEMPT (ulemavu)
                    </span>
                  ) : (
                    <>
                      <span className="inline-block text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: "#fef3c7", color: "#92400e" }}>
                        TZS {Number(l.amount || 2000).toLocaleString()}
                      </span>
                      <span className="inline-block text-[10px] px-1.5 py-0.5 rounded font-bold"
                        style={{ background: l.paid ? "#dcfce7" : "#fee2e2", color: l.paid ? "#166534" : "#991b1b" }}>
                        {l.paid ? "PAID ✓" : "UNPAID"}
                      </span>
                      {l.paid && l.service_number && (
                        <span className="text-[10px] font-mono text-muted-foreground">#{l.service_number}</span>
                      )}
                    </>
                  )}
                </div>
                {l.ref_no && <div className="text-[11px] font-mono text-muted-foreground mt-0.5">{l.ref_no}</div>}
              </div>
              {filter === "pending" && (
                <div className="flex flex-col gap-2 shrink-0">
                  {(l.paid || l.fee_type === "free") ? (
                    <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => openApprove(l, l.fee_type === "paid")}>
                      <Check className="h-3.5 w-3.5 mr-1" /> Sign & Approve
                    </Button>
                  ) : (
                    <span className="text-xs text-amber-600 font-semibold text-right max-w-[140px]">
                      Awaiting student payment
                    </span>
                  )}
                  <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => reject(l)}>
                    <X className="h-3.5 w-3.5 mr-1" /> Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Approve dialog — require signature + stamp */}
      <Dialog open={!!approving} onOpenChange={(o) => !o && setApproving(null)}>
        <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Sign & Stamp to Approve</DialogTitle></DialogHeader>
          {approving && (
            <ApproveForm
              letter={approving}
              schoolCode={me.schoolCode!}
              defaultSignature={school?.signature}
              defaultStamp={school?.stamp}
              paid={approvePaid}
              onApprove={(sig, stamp) => finalizeApprove(approving, sig, stamp, approvePaid)}
              onSaveDefaults={async (sig, stamp) => {
                await supabase.from("schools").update({ signature: sig, stamp }).eq("school_code", me.schoolCode!);
                qc.invalidateQueries({ queryKey: ["school-marks"] });
                toast.success("Saved as school defaults");
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ApproveForm({ letter, schoolCode, defaultSignature, defaultStamp, paid, onApprove, onSaveDefaults }: {
  letter: any; schoolCode: string;
  defaultSignature?: string | null; defaultStamp?: string | null; paid: boolean;
  onApprove: (signature: string, stamp: string) => void;
  onSaveDefaults: (signature: string, stamp: string) => void;
}) {
  const [signature, setSignature] = useState<string>(defaultSignature ?? "");
  const [stamp, setStamp] = useState<string>(defaultStamp ?? "");
  const [useDefaults, setUseDefaults] = useState(!!(defaultSignature && defaultStamp));

  const ready = !!signature && !!stamp;

  return (
    <div className="space-y-4 py-1">
      <div className="rounded-lg bg-muted/40 p-3 text-sm">
        <div className="font-semibold">{letter.student_name} · {letter.tsid}</div>
        <div className="text-muted-foreground text-xs">{letter.purpose} · {paid ? "PAID" : letter.fee_type === "paid" ? "PAID (unpaid flag)" : "FREE"}</div>
      </div>

      {useDefaults && defaultSignature && defaultStamp ? (
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Signature</div>
              <img src={defaultSignature} alt="signature" className="h-12 border rounded bg-white" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Stamp</div>
              <img src={defaultStamp} alt="stamp" className="h-16 border rounded bg-white" />
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setUseDefaults(false)}>Use different signature / stamp</Button>
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            <Label>Signature * (draw or upload)</Label>
            <SignaturePad pathPrefix={`schools/${schoolCode}/signature`} currentUrl={signature || null} onSaved={setSignature} />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1"><StampIcon className="h-3.5 w-3.5" /> School Stamp * (upload)</Label>
            <PhotoUpload pathPrefix={`schools/${schoolCode}/stamp`} currentUrl={stamp || null} shape="square" label="Upload stamp" onUploaded={setStamp} />
          </div>
          {signature && stamp && (
            <button className="text-xs text-primary underline" onClick={() => onSaveDefaults(signature, stamp)}>
              Save these as school defaults (reuse next time)
            </button>
          )}
        </>
      )}

      <Button className="w-full bg-primary" disabled={!ready} onClick={() => onApprove(signature, stamp)}>
        <Check className="h-4 w-4 mr-2" /> Approve, Sign & Stamp
      </Button>
      {!ready && <p className="text-xs text-amber-600 text-center">Provide both a signature and a stamp to approve.</p>}
    </div>
  );
}
