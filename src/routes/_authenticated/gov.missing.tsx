import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { AlertTriangle, Phone, MapPin, Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/gov/missing")({ component: Page });

function Page() {
  const me = useCurrentUser();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"reported" | "active">("reported");

  const { data: rows = [] } = useQuery({
    queryKey: ["missing-students", tab, me.region, me.district],
    queryFn: async () => {
      let q = supabase.from("students")
        .select("tsid,fullname,photo,level,school_name,region,district,parent_name,parent_phone,emergency_contact_name,emergency_contact_phone,home_address,missing,missing_reported,missing_reported_by,missing_reported_at,missing_since,missing_note");
      q = tab === "reported" ? q.eq("missing_reported", true).eq("missing", false) : q.eq("missing", true);
      const { data } = await q.order("missing_reported_at", { ascending: false });
      return data ?? [];
    },
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });

  async function activate(s: any) {
    const { error } = await supabase.from("students").update({
      missing: true, missing_since: new Date().toISOString(), missing_by: me.fullName ?? "Ministry",
    }).eq("tsid", s.tsid);
    if (error) { toast.error(error.message); return; }
    toast.success("Missing badge activated (public)");
    qc.invalidateQueries({ queryKey: ["missing-students"] });
  }
  async function clear(s: any) {
    const { error } = await supabase.from("students").update({
      missing: false, missing_since: null, missing_by: null,
      missing_reported: false, missing_reported_by: null, missing_reported_at: null, missing_note: null,
    }).eq("tsid", s.tsid);
    if (error) { toast.error(error.message); return; }
    toast.success("Cleared — child found");
    qc.invalidateQueries({ queryKey: ["missing-students"] });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-red-600 text-white p-6">
        <div className="flex items-center gap-2"><AlertTriangle className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Missing Children</h1>
            <p className="text-sm opacity-90">Review school reports and activate the public missing badge.</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {(["reported", "active"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
            {t === "reported" ? "Pending Activation" : "Active (Public)"} ({tab === t ? rows.length : ""})
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {rows.length === 0 && <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground text-sm">No {tab === "reported" ? "pending reports" : "active cases"}.</div>}
        {rows.map((s: any) => (
          <div key={s.tsid} className="rounded-2xl border bg-card p-4 flex items-start gap-4 flex-wrap">
            <div className="h-20 w-20 rounded-xl overflow-hidden bg-muted border shrink-0 flex items-center justify-center">
              {s.photo ? <img src={s.photo} alt="" className="h-full w-full object-cover" /> : <span className="text-3xl">👤</span>}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold">{s.fullname} <span className="font-mono text-xs text-muted-foreground">{s.tsid}</span></div>
              <div className="text-sm text-muted-foreground">{s.level} · {s.school_name} · {[s.district, s.region].filter(Boolean).join(", ")}</div>
              {s.missing_note && <div className="text-sm mt-1">{s.missing_note}</div>}
              <div className="text-xs text-muted-foreground mt-1">
                {tab === "reported"
                  ? <>Reported by {s.missing_reported_by} · {s.missing_reported_at ? new Date(s.missing_reported_at).toLocaleString() : ""}</>
                  : <>Active since {s.missing_since ? new Date(s.missing_since).toLocaleString() : ""}</>}
              </div>
              <div className="mt-2 rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs space-y-0.5">
                <div className="font-semibold text-red-800 flex items-center gap-1"><Phone className="h-3 w-3" /> Emergency Contacts</div>
                {s.parent_name && <div>Parent: {s.parent_name} {s.parent_phone ? `· ${s.parent_phone}` : ""}</div>}
                {s.emergency_contact_name && <div>Emergency: {s.emergency_contact_name} {s.emergency_contact_phone ? `· ${s.emergency_contact_phone}` : ""}</div>}
                {s.home_address && <div className="flex items-start gap-1"><MapPin className="h-3 w-3 mt-0.5" /> {s.home_address}</div>}
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              {tab === "reported"
                ? <Button size="sm" variant="destructive" onClick={() => activate(s)}><AlertTriangle className="h-3.5 w-3.5 mr-1" /> Activate Badge</Button>
                : <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200" onClick={() => clear(s)}><Check className="h-3.5 w-3.5 mr-1" /> Mark Found</Button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
