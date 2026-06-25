import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";

export const Route = createFileRoute("/_authenticated/district/")({ component: Page });

function Page() {
  const me = useCurrentUser();

  const { data: schools = [] } = useQuery({
    enabled: !!me.district,
    queryKey: ["district-schools", me.district],
    queryFn: async () => (await supabase.from("schools").select("school_code,school_name,status").eq("district", me.district!)).data ?? [],
  });
  const { data: students = [] } = useQuery({
    enabled: !!me.district,
    queryKey: ["district-students", me.district],
    queryFn: async () => (await supabase.from("students").select("tsid,status").eq("district", me.district!)).data ?? [],
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-primary text-primary-foreground p-6">
        <div className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">District Portal</div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>{me.district} Dashboard</h1>
        <p className="text-sm opacity-80 mt-1">Schools and students in {me.district}, {me.region}.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Schools", value: schools.length, color: "#1EB53A" },
          { label: "Students", value: students.length, color: "#002855" },
          { label: "Active IDs", value: students.filter((s: any) => s.status === "active").length, color: "#007AFF" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border bg-card p-5">
            <div className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30 font-semibold text-sm">Schools in {me.district}</div>
        <div className="divide-y">
          {schools.length === 0 && <div className="p-8 text-center text-muted-foreground text-sm">No schools registered yet.</div>}
          {schools.map((s: any) => (
            <div key={s.school_code} className="px-4 py-3 flex items-center justify-between text-sm">
              <div><span className="font-medium">{s.school_name}</span> <span className="font-mono text-xs text-muted-foreground">{s.school_code}</span></div>
              <span className="text-xs capitalize" style={{ color: s.status === "active" ? "#16a34a" : "#94a3b8" }}>{s.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
