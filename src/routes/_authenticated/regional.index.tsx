import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";

export const Route = createFileRoute("/_authenticated/regional/")({ component: Page });

function Page() {
  const me = useCurrentUser();

  const { data: schools = [] } = useQuery({
    enabled: !!me.region,
    queryKey: ["regional-schools", me.region],
    queryFn: async () => (await supabase.from("schools").select("school_code,district,status").eq("region", me.region!)).data ?? [],
  });
  const { data: students = [] } = useQuery({
    enabled: !!me.region,
    queryKey: ["regional-students", me.region],
    queryFn: async () => (await supabase.from("students").select("tsid,district,status").eq("region", me.region!)).data ?? [],
  });

  const activeSchools = schools.filter((s: any) => s.status === "active").length;
  // Group by district
  const byDistrict = schools.reduce((acc: Record<string, number>, s: any) => {
    acc[s.district] = (acc[s.district] ?? 0) + 1; return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-primary text-primary-foreground p-6">
        <div className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">Regional Portal</div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>{me.region} Dashboard</h1>
        <p className="text-sm opacity-80 mt-1">Overview of schools and students across {me.region}.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Schools", value: schools.length, color: "#1EB53A" },
          { label: "Active Schools", value: activeSchools, color: "#007AFF" },
          { label: "Students", value: students.length, color: "#002855" },
          { label: "Districts", value: Object.keys(byDistrict).length, color: "#F5C400" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border bg-card p-5">
            <div className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30 font-semibold text-sm">Schools by District</div>
        <div className="divide-y">
          {Object.entries(byDistrict).length === 0 && <div className="p-8 text-center text-muted-foreground text-sm">No schools registered in {me.region} yet.</div>}
          {Object.entries(byDistrict).sort((a, b) => b[1] - a[1]).map(([district, count]) => (
            <div key={district} className="px-4 py-3 flex items-center justify-between text-sm">
              <span className="font-medium">{district}</span>
              <span className="text-muted-foreground">{count} school{count !== 1 ? "s" : ""}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
