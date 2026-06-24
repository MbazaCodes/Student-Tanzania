import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/school/applications")({ component: Page });

function Page() {
  const me = useCurrentUser();
  const qc = useQueryClient();

  const { data = [] } = useQuery({
    enabled: !!me.schoolCode,
    queryKey: ["school-apps", me.schoolCode],
    queryFn: async () =>
      (await supabase.from("applications").select("id,fullname,level,status,submitted_at,tsid").eq("school_code", me.schoolCode!).order("submitted_at", { ascending: false })).data ?? [],
  });

  async function setStatus(id: string, status: "approved" | "rejected") {
    const { error } = await supabase.from("applications").update({ status, decided_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["school-apps"] }); }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>Applications</h1>
      <div className="rounded-2xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="px-4 py-3">When</th><th className="px-4 py-3">Applicant</th><th className="px-4 py-3">Level</th><th className="px-4 py-3">TSID</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th></tr>
          </thead>
          <tbody>
            {data.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(a.submitted_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 font-medium">{a.fullname}</td>
                <td className="px-4 py-3 text-sm">{a.level}</td>
                <td className="px-4 py-3 font-mono text-xs">{a.tsid ?? "—"}</td>
                <td className="px-4 py-3 capitalize">{a.status}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  {a.status === "pending" && (<>
                    <Button size="sm" variant="outline" onClick={() => setStatus(a.id, "rejected")}>Reject</Button>
                    <Button size="sm" onClick={() => setStatus(a.id, "approved")}>Approve</Button>
                  </>)}
                </td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No applications yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}