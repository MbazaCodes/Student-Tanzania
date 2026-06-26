import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { FileText, Check, X, Clock } from "lucide-react";
import { generateLetterRef } from "@/lib/letter-requests";

export const Route = createFileRoute("/_authenticated/school/letters")({ component: Page });

function Page() {
  const me = useCurrentUser();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");

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

  async function review(l: any, decision: "approved" | "rejected", markPaid = false) {
    const updates: any = {
      status: decision, reviewer: me.userId, reviewer_name: me.fullName ?? "School",
      reviewed_at: new Date().toISOString(),
    };
    if (decision === "approved") {
      updates.ref_no = generateLetterRef();
      if (markPaid) updates.paid = true;
    }
    const { error } = await supabase.from("letter_requests").update(updates).eq("id", l.id);
    if (error) { toast.error(error.message); return; }
    await supabase.from("activity_logs").insert({
      action: `letter:${decision}`, message: `${decision} letter (${l.purpose}) for ${l.tsid}`,
      by_name: me.fullName ?? "School", by_role: "school", by_ref: l.tsid,
    });
    toast.success(decision === "approved" ? "Approved" : "Rejected");
    qc.invalidateQueries({ queryKey: ["school-letters"] });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>Letter Requests</h1>
        <p className="text-sm text-muted-foreground">Review and approve student letter requests. Approved letters become downloadable.</p>
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
                <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded font-bold"
                  style={{ background: l.fee_type === "paid" ? "#fef3c7" : "#dcfce7", color: l.fee_type === "paid" ? "#92400e" : "#166534" }}>
                  {l.fee_type === "paid" ? `PAID · TZS ${Number(l.amount).toLocaleString()}` : "FREE"}
                </span>
                {l.ref_no && <div className="text-[11px] font-mono text-muted-foreground mt-0.5">{l.ref_no}</div>}
              </div>
              {filter === "pending" && (
                <div className="flex flex-col gap-2 shrink-0">
                  {l.fee_type === "paid" ? (
                    <>
                      <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => review(l, "approved", true)}>
                        <Check className="h-3.5 w-3.5 mr-1" /> Approve (paid)
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => review(l, "approved", false)}>
                        Approve (unpaid)
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => review(l, "approved")}>
                      <Check className="h-3.5 w-3.5 mr-1" /> Approve
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => review(l, "rejected")}>
                    <X className="h-3.5 w-3.5 mr-1" /> Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
