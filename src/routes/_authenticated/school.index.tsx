import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/lib/theme";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Users, GraduationCap, BadgeCheck, AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/school/")({ component: Page });

function Page() {
  const me = useCurrentUser();
  const { t } = useTheme();

  const { data: school } = useQuery({
    enabled: !!me.schoolCode,
    queryKey: ["school", me.schoolCode],
    queryFn: async () => (await supabase.from("schools").select("*").eq("code", me.schoolCode!).maybeSingle()).data,
  });

  const { data: students = [] } = useQuery({
    enabled: !!me.schoolCode,
    queryKey: ["school-students", me.schoolCode],
    queryFn: async () =>
      (await supabase.from("students").select("tsid,fullname,level,status,created_at").eq("school_code", me.schoolCode!).order("created_at", { ascending: false })).data ?? [],
  });

  const { data: pendingApps = [] } = useQuery({
    enabled: !!me.schoolCode,
    queryKey: ["school-pending-apps", me.schoolCode],
    queryFn: async () =>
      (await supabase.from("applications").select("id").eq("school_code", me.schoolCode!).eq("status", "pending")).data ?? [],
  });

  if (!me.loading && !me.schoolCode) {
    return (
      <div className="rounded-2xl border bg-card p-8 max-w-xl">
        <div className="flex items-center gap-2 text-amber-600 font-semibold">
          <AlertTriangle className="h-5 w-5" /> No school linked
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account isn't linked to a school yet. Contact the government administrator.
        </p>
      </div>
    );
  }

  const recent = students.slice(0, 5);
  const active = students.filter((s) => s.status === "active").length;
  const levelMap: Record<string, number> = {};
  students.forEach((s) => { const l = s.level ?? "Unset"; levelMap[l] = (levelMap[l] ?? 0) + 1; });

  const tiles = [
    { label: t("total_students"), value: students.length, icon: Users, color: "var(--tz-navy)" },
    { label: t("active_ids"), value: active, icon: BadgeCheck, color: "var(--tz-green)" },
    { label: t("pending_apps"), value: pendingApps.length, icon: GraduationCap, color: "var(--tz-gold)" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>
            {school?.name ?? "School Dashboard"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {school?.type}{school?.region ? ` · ${school.region}` : ""}{school?.district ? `, ${school.district}` : ""}
            {school?.code && <> · Code <span className="font-mono text-foreground">{school.code}</span></>}
          </p>
        </div>
        <Button asChild className="bg-primary">
          <Link to="/school/students"><Plus className="h-4 w-4 mr-2" /> Create Student</Link>
        </Button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-2xl border bg-card p-5">
            <div className="h-9 w-9 rounded-lg flex items-center justify-center text-white" style={{ background: tile.color }}>
              <tile.icon className="h-4 w-4" />
            </div>
            <div className="mt-3 text-3xl font-bold">{tile.value}</div>
            <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{tile.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <span className="font-semibold text-sm">Recently Registered</span>
            <Link to="/school/students" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          {recent.length === 0 ? (
            <p className="px-4 py-8 text-sm text-center text-muted-foreground">No students yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-4 py-2 text-left">Name</th><th className="px-4 py-2 text-left">TSID</th><th className="px-4 py-2 text-left">Level</th></tr>
              </thead>
              <tbody>
                {recent.map((st) => (
                  <tr key={st.tsid} className="border-t">
                    <td className="px-4 py-2 font-medium">{st.fullname}</td>
                    <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{st.tsid}</td>
                    <td className="px-4 py-2 text-xs">{st.level ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b font-semibold text-sm">Students by Level</div>
          <div className="p-4 space-y-3">
            {Object.keys(levelMap).length === 0 ? (
              <p className="text-sm text-center text-muted-foreground py-4">No students yet.</p>
            ) : Object.entries(levelMap).map(([level, count]) => {
              const pct = students.length ? Math.round((count / students.length) * 100) : 0;
              return (
                <div key={level}>
                  <div className="flex justify-between text-sm mb-1"><span className="font-medium">{level}</span><span className="font-bold text-primary">{count}</span></div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}