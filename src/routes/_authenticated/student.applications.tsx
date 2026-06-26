import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, FileText, Clock, CheckCircle2, XCircle, Download, Smartphone, Receipt, Loader2 } from "lucide-react";
import { TZ_REGIONS, TZ_DISTRICTS } from "@/lib/tz-geo";
import {
  type Sector, purposesForSector, COMMON_REASONS, feeForPurpose,
  LETTER_FEE, generateServiceNumber, generateReceiptNo,
} from "@/lib/letter-requests";
import { LetterDocument, type LetterData } from "@/components/tsid/letter-document";
import { ReceiptDocument, type ReceiptData } from "@/components/tsid/receipt-document";

export const Route = createFileRoute("/_authenticated/student/applications")({ component: Page });

function Page() {
  const me = useCurrentUser();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [viewLetter, setViewLetter] = useState<any | null>(null);
  const [payLetter, setPayLetter] = useState<any | null>(null);
  const [viewReceipt, setViewReceipt] = useState<any | null>(null);

  const { data: student } = useQuery({
    enabled: !!me.tsid,
    queryKey: ["my-student-min", me.tsid],
    queryFn: async () => (await supabase.from("students").select("tsid,fullname,school_code,school_name,level,photo").eq("tsid", me.tsid!).maybeSingle()).data,
  });

  const { data: letters = [] } = useQuery({
    enabled: !!me.tsid,
    queryKey: ["my-letters", me.tsid],
    queryFn: async () => (await supabase.from("letter_requests").select("*").eq("tsid", me.tsid!).order("created_at", { ascending: false })).data ?? [],
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
    refetchInterval: 30000,
  });

  const pending = letters.filter((l: any) => l.status === "pending").length;
  const approved = letters.filter((l: any) => l.status === "approved").length;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-primary text-primary-foreground p-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">Letter Requests</div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>My Applications</h1>
          <p className="text-sm opacity-80 mt-1">Request official letters for government or private use.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary" disabled={!student}><Plus className="h-4 w-4 mr-2" /> New Request</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Request Official Letter</DialogTitle></DialogHeader>
            {student && <RequestForm student={student} me={me} onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["my-letters"] }); }} />}
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total", value: letters.length, color: "#002855" },
          { label: "Pending", value: pending, color: "#F5C400" },
          { label: "Approved", value: approved, color: "#1EB53A" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border bg-card p-5">
            <div className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30 font-semibold text-sm">My Letter Requests</div>
        <div className="divide-y">
          {letters.length === 0 && (
            <div className="p-10 text-center text-muted-foreground text-sm">No requests yet. Click "New Request" to start.</div>
          )}
          {letters.map((l: any) => (
            <div key={l.id} className="p-4 flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-semibold">{l.purpose}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted capitalize">{l.sector}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                    style={{ background: l.fee_type === "paid" ? "#fef3c7" : "#dcfce7", color: l.fee_type === "paid" ? "#92400e" : "#166534" }}>
                    {l.fee_type === "paid" ? `PAID · TZS ${Number(l.amount).toLocaleString()}${l.paid ? " ✓" : " (unpaid)"}` : "FREE"}
                  </span>
                </div>
                {l.reason && <div className="text-xs text-muted-foreground mt-1">{l.reason}</div>}
                {l.recipient_name && <div className="text-xs text-muted-foreground mt-0.5">To: {l.recipient_name}{l.district ? ` · ${l.district}, ${l.region}` : ""}</div>}
                {l.ref_no && <div className="text-[11px] font-mono text-muted-foreground mt-0.5">{l.ref_no}</div>}
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                <StatusBadge status={l.status} />

                {/* Pay button — when unpaid */}
                {!l.paid && (
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setPayLetter(l)}>
                    <Smartphone className="h-3.5 w-3.5 mr-1" /> Pay TZS {Number(l.amount || 2000).toLocaleString()}
                  </Button>
                )}

                {/* Receipt — when paid */}
                {l.paid && (
                  <Button size="sm" variant="outline" onClick={() => setViewReceipt(l)}>
                    <Receipt className="h-3.5 w-3.5 mr-1" /> Receipt
                  </Button>
                )}

                {/* Letter — when approved AND paid */}
                {l.status === "approved" && l.paid && (
                  <Button size="sm" variant="outline" onClick={() => setViewLetter(l)}>
                    <Download className="h-3.5 w-3.5 mr-1" /> Letter
                  </Button>
                )}

                {/* Waiting note */}
                {l.status === "pending" && l.paid && (
                  <span className="text-xs text-muted-foreground">Paid · awaiting approval</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Letter preview/download dialog */}
      <Dialog open={!!viewLetter} onOpenChange={(o) => !o && setViewLetter(null)}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Official Letter</DialogTitle></DialogHeader>
          {viewLetter && student && (
            <LetterDocument data={{
              ref_no: viewLetter.ref_no ?? "—",
              date: new Date(viewLetter.reviewed_at ?? viewLetter.created_at).toLocaleDateString("en-GB"),
              student_name: viewLetter.student_name ?? student.fullname,
              tsid: viewLetter.tsid,
              school_name: viewLetter.school_name ?? student.school_name,
              level: student.level,
              sector: viewLetter.sector,
              purpose: viewLetter.purpose,
              reason: viewLetter.reason,
              recipient_name: viewLetter.recipient_name,
              recipient_address: viewLetter.recipient_address,
              region: viewLetter.region,
              district: viewLetter.district,
              photo: student.photo,
              signature: viewLetter.signature,
              stamp: viewLetter.stamp,
              signed_by: viewLetter.signed_by,
            } as LetterData} />
          )}
        </DialogContent>
      </Dialog>

      {/* Payment dialog */}
      <Dialog open={!!payLetter} onOpenChange={(o) => !o && setPayLetter(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Pay for Letter</DialogTitle></DialogHeader>
          {payLetter && (
            <PayForm
              letter={payLetter}
              onPaid={() => { setPayLetter(null); qc.invalidateQueries({ queryKey: ["my-letters"] }); }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt dialog */}
      <Dialog open={!!viewReceipt} onOpenChange={(o) => !o && setViewReceipt(null)}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Payment Receipt</DialogTitle></DialogHeader>
          {viewReceipt && (
            <ReceiptDocument data={{
              receipt_no: viewReceipt.receipt_no ?? "—",
              service_number: viewReceipt.service_number ?? "—",
              payment_ref: viewReceipt.payment_ref,
              payment_method: viewReceipt.payment_method,
              date: new Date(viewReceipt.paid_at ?? viewReceipt.created_at).toLocaleDateString("en-GB"),
              student_name: viewReceipt.student_name,
              tsid: viewReceipt.tsid,
              school_name: viewReceipt.school_name,
              purpose: viewReceipt.purpose,
              amount: Number(viewReceipt.amount || 2000),
            } as ReceiptData} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PayForm({ letter, onPaid }: { letter: any; onPaid: () => void }) {
  const [method, setMethod] = useState<"mobile" | "online">("mobile");
  const [phone, setPhone] = useState("");
  const [processing, setProcessing] = useState(false);
  const amount = Number(letter.amount || LETTER_FEE);

  // Service number is generated once and shown so the student can pay by phone.
  const [serviceNumber] = useState(() => letter.service_number || generateServiceNumber());

  async function pay() {
    if (method === "mobile" && phone.replace(/\D/g, "").length < 9) {
      toast.error("Enter a valid phone number"); return;
    }
    setProcessing(true);
    // SIMULATED payment — replace with real gateway later.
    await new Promise((r) => setTimeout(r, 1800));
    const payment_ref = `MOCK-${Date.now().toString().slice(-8)}`;
    const receipt_no = generateReceiptNo();
    const { error } = await supabase.from("letter_requests").update({
      paid: true, fee_type: "paid", amount,
      service_number: serviceNumber, payment_method: method,
      payment_ref, receipt_no, paid_at: new Date().toISOString(),
    }).eq("id", letter.id);
    setProcessing(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Payment successful — receipt generated");
    onPaid();
  }

  return (
    <div className="space-y-4 py-1">
      <div className="rounded-lg bg-muted/40 p-3 text-sm">
        <div className="font-semibold">{letter.purpose}</div>
        <div className="text-muted-foreground text-xs">{letter.student_name} · {letter.tsid}</div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Amount</span>
          <span className="text-lg font-bold text-emerald-600">TZS {amount.toLocaleString()}</span>
        </div>
      </div>

      {/* Service / control number for phone payment */}
      <div className="rounded-lg border border-dashed p-3 text-center">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Service / Control Number</div>
        <div className="text-xl font-mono font-bold tracking-wider text-primary">{serviceNumber}</div>
        <div className="text-[11px] text-muted-foreground mt-1">Use this number to pay via your mobile money (dial *150*...#)</div>
      </div>

      {/* Method */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setMethod("mobile")}
          className={`rounded-lg border p-3 text-sm font-semibold flex items-center justify-center gap-2 ${method === "mobile" ? "border-primary bg-primary/5 text-primary" : "text-muted-foreground"}`}>
          <Smartphone className="h-4 w-4" /> Mobile
        </button>
        <button onClick={() => setMethod("online")}
          className={`rounded-lg border p-3 text-sm font-semibold flex items-center justify-center gap-2 ${method === "online" ? "border-primary bg-primary/5 text-primary" : "text-muted-foreground"}`}>
          <Receipt className="h-4 w-4" /> Online
        </button>
      </div>

      {method === "mobile" && (
        <div className="space-y-1.5">
          <Label>Phone Number</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XX XXX XXX" inputMode="tel" />
          <p className="text-[11px] text-muted-foreground">You'll receive a USSD push to confirm. (Simulated for now.)</p>
        </div>
      )}

      <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={pay} disabled={processing}>
        {processing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing…</> : <>Pay TZS {amount.toLocaleString()}</>}
      </Button>
      <p className="text-[11px] text-center text-muted-foreground">Demo mode — payment is simulated and marked complete instantly.</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { icon: any; color: string; bg: string }> = {
    pending: { icon: Clock, color: "#92400e", bg: "#fef3c7" },
    approved: { icon: CheckCircle2, color: "#166534", bg: "#dcfce7" },
    rejected: { icon: XCircle, color: "#991b1b", bg: "#fee2e2" },
  };
  const m = map[status] ?? map.pending;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full capitalize" style={{ background: m.bg, color: m.color }}>
      <m.icon className="h-3 w-3" /> {status}
    </span>
  );
}

function RequestForm({ student, me, onDone }: { student: any; me: any; onDone: () => void }) {
  const [sector, setSector] = useState<Sector>("government");
  const [purpose, setPurpose] = useState("");
  const [reasonSel, setReasonSel] = useState("");
  const [reasonOther, setReasonOther] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [region, setRegion] = useState("");
  const [district, setDistrict] = useState("");
  const [loading, setLoading] = useState(false);

  const purposes = purposesForSector(sector);
  const districts = region ? (TZ_DISTRICTS[region] ?? []) : [];
  const isOtherReason = reasonSel === "Other (type below)";

  async function submit() {
    if (!purpose) { toast.error("Select a purpose."); return; }
    const reason = isOtherReason ? reasonOther : reasonSel;
    if (!reason) { toast.error("Select or enter a reason."); return; }
    setLoading(true);
    const fee = feeForPurpose(purpose);
    const { error } = await supabase.from("letter_requests").insert({
      tsid: student.tsid, student_name: student.fullname,
      school_code: student.school_code, school_name: student.school_name,
      sector, purpose, reason,
      recipient_name: recipientName || null,
      recipient_address: recipientAddress || null,
      region: region || null, district: district || null,
      fee_type: fee.fee_type, amount: fee.amount, paid: false,
      status: "pending",
    });
    if (error) { toast.error(error.message); setLoading(false); return; }
    setLoading(false);
    toast.success("Letter request submitted for school approval");
    onDone();
  }

  return (
    <div className="space-y-3 py-2">
      {/* Sector */}
      <div className="space-y-1.5">
        <Label>Sector *</Label>
        <Select value={sector} onValueChange={(v) => { setSector(v as Sector); setPurpose(""); }}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="government">Government</SelectItem>
            <SelectItem value="private">Private</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Purpose */}
      <div className="space-y-1.5">
        <Label>Purpose *</Label>
        <Select value={purpose} onValueChange={setPurpose}>
          <SelectTrigger><SelectValue placeholder="Select purpose" /></SelectTrigger>
          <SelectContent>{purposes.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
        </Select>
        {purpose && (
          <p className="text-xs text-muted-foreground">
            This letter has a fee of <strong>TZS {LETTER_FEE.toLocaleString()}</strong>, payable after submission.
          </p>
        )}
      </div>

      {/* Reason dropdown + Other */}
      <div className="space-y-1.5">
        <Label>Reason *</Label>
        <Select value={reasonSel} onValueChange={setReasonSel}>
          <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
          <SelectContent>{COMMON_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
        </Select>
        {isOtherReason && (
          <Input value={reasonOther} onChange={(e) => setReasonOther(e.target.value)} placeholder="Type your reason" />
        )}
      </div>

      {/* Recipient */}
      <div className="space-y-1.5">
        <Label>Addressed To (recipient)</Label>
        <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="e.g. The Director, NHIF" />
      </div>
      <div className="space-y-1.5">
        <Label>Recipient Address</Label>
        <Input value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} placeholder="P.O. Box / street" />
      </div>

      {/* Region → District cascade */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Region</Label>
          <Select value={region} onValueChange={(v) => { setRegion(v); setDistrict(""); }}>
            <SelectTrigger><SelectValue placeholder="Region" /></SelectTrigger>
            <SelectContent>{TZ_REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>District</Label>
          <Select value={district} onValueChange={setDistrict} disabled={!region}>
            <SelectTrigger><SelectValue placeholder={region ? "District" : "Region first"} /></SelectTrigger>
            <SelectContent>{districts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <Button className="w-full bg-primary" onClick={submit} disabled={loading}>
        {loading ? "Submitting…" : "Submit Request"}
      </Button>
    </div>
  );
}
