import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyChildren } from "./parent.index";
import { Wallet } from "lucide-react";

export const Route = createFileRoute("/_authenticated/parent/fees")({ component: Page });

function Page() {
  const { data: children = [] } = useMyChildren();
  const { data: paid = [] } = useQuery({
    enabled: children.length > 0,
    queryKey: ["parent-fees", children.map((c: any) => c.tsid).join(",")],
    queryFn: async () => {
      const tsids = children.map((c: any) => c.tsid);
      if (!tsids.length) return [];
      return (await supabase.from("letter_requests").select("*").in("tsid", tsids).eq("paid", true).order("paid_at", { ascending: false })).data ?? [];
    },
  });

  const total = paid.reduce((a: number, p: any) => a + Number(p.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-primary text-primary-foreground p-6">
        <div className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">Fees / Contribution</div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Payments</h1>
        <p className="text-sm opacity-80 mt-1">Fees and contributions paid for your children.</p>
        <div className="mt-3 text-3xl font-bold">TZS {total.toLocaleString()}</div>
        <div className="text-xs opacity-80">Total paid</div>
      </div>

      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30 font-semibold text-sm flex items-center gap-2"><Wallet className="h-4 w-4" /> Payment History</div>
        <div className="divide-y">
          {paid.length === 0 && <div className="p-10 text-center text-muted-foreground text-sm">No payments yet.</div>}
          {paid.map((p: any) => (
            <div key={p.id} className="p-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-sm">{p.purpose}</div>
                <div className="text-xs text-muted-foreground">{p.student_name} · {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : ""}{p.receipt_no ? ` · ${p.receipt_no}` : ""}</div>
              </div>
              <div className="font-bold text-emerald-600">TZS {Number(p.amount || 0).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
