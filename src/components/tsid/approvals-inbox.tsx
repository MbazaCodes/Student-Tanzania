import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, X, Clock, ChevronRight } from "lucide-react";
import { applyChangeRequest, fieldLabel, type ChangeSet } from "@/lib/change-requests";
import { useState } from "react";

type CR = {
  id: string; entity: string; entity_ref: string; entity_name: string | null;
  severity: string; approver_level: string; changes: ChangeSet; status: string;
  requested_by_name: string | null; requested_by_role: string | null;
  school_code: string | null; region: string | null; district: string | null;
  created_at: string;
};

/**
 * Approvals inbox. `level` controls which requests are shown:
 *  - 'school' → minor student requests for this school
 *  - 'admin'  → major student + school requests in scope
 */
export function ApprovalsInbox({ level }: { level: "admin" | "school" }) {
  const qc = useQueryClient();
  const me = useCurrentUser();
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["change-requests", level, filter],
    queryFn: async () => {
      let q = supabase.from("change_requests")
        .select("*")
        .eq("approver_level", level)
        .eq("status", filter)
        .order("created_at", { ascending: false });
      return (await q).data as CR[] ?? [];
    },
  });

  async function review(cr: CR, decision: "approved" | "rejected") {
    if (decision === "approved") {
      const { error: applyErr } = await applyChangeRequest(cr);
      if (applyErr) { toast.error(`Apply failed: ${applyErr.message}`); return; }
    }
    const { error } = await supabase.from("change_requests").update({
      status: decision,
      reviewer: me.userId,
      reviewer_name: me.fullName ?? "Reviewer",
      reviewed_at: new Date().toISOString(),
    }).eq("id", cr.id);
    if (error) { toast.error(error.message); return; }

    await supabase.from("activity_logs").insert({
      action: `change:${decision}`,
      message: `${decision === "approved" ? "Approved" : "Rejected"} ${cr.entity} change for ${cr.entity_name ?? cr.entity_ref}`,
      by_name: me.fullName ?? "Reviewer", by_role: me.role ?? level, by_ref: cr.entity_ref,
    });

    toast.success(decision === "approved" ? "Approved & applied" : "Rejected");
    qc.invalidateQueries({ queryKey: ["change-requests"] });
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["pending", "approved", "rejected"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}>
            {f}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30 font-semibold text-sm flex items-center gap-2">
          <Clock className="h-4 w-4" /> {filter} requests ({requests.length})
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading…</div>
        ) : requests.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm">No {filter} requests.</div>
        ) : (
          <div className="divide-y">
            {requests.map((cr) => (
              <div key={cr.id} className="p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{cr.entity_name ?? cr.entity_ref}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase"
                        style={{
                          background: cr.severity === "major" ? "#fef2f2" : "#f0f9ff",
                          color: cr.severity === "major" ? "#dc2626" : "#0284c7",
                        }}>
                        {cr.severity}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground capitalize">{cr.entity}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {cr.entity_ref}
                      {cr.requested_by_name && <> · requested by {cr.requested_by_name}</>}
                      {cr.school_code && <> · {cr.school_code}</>}
                    </div>
                    {/* Changes */}
                    <div className="mt-2 space-y-1">
                      {Object.entries(cr.changes).map(([field, val]) => (
                        <div key={field} className="text-xs flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{fieldLabel(field)}:</span>
                          <span className="line-through text-muted-foreground">{String(val.old ?? "—")}</span>
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          <span className="text-emerald-600 font-medium">{String(val.new ?? "—")}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {filter === "pending" && (
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                        onClick={() => review(cr, "approved")}>
                        <Check className="h-3.5 w-3.5 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => review(cr, "rejected")}>
                        <X className="h-3.5 w-3.5 mr-1" /> Reject
                      </Button>
                    </div>
                  )}
                  {filter !== "pending" && (
                    <div className="text-xs text-muted-foreground shrink-0">
                      {cr.status} {cr.reviewer_name ? `by ${cr.reviewer_name}` : ""}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
