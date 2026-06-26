import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/lib/theme";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Users, GraduationCap, BadgeCheck, AlertTriangle, Plus, UserX, UserCheck, Mail, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { levelsForSchoolType } from "@/lib/tz-geo";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/_authenticated/school/")({ component: Page });

const STATUS_COLORS: Record<string, string> = {
  active: "#1EB53A", dropped: "#dc2626", suspended: "#f59e0b",
  graduated: "#3b82f6", transferred: "#8b5cf6", inactive: "#94a3b8",
};

function Page() {
  const me = useCurrentUser();
  const { t } = useTheme();
  const [gradeFilter, setGradeFilter] = useState<string>("all");

  const { data: school } = useQuery({
    enabled: !!me.schoolCode,
    queryKey: ["school", me.schoolCode],
    queryFn: async () => (await supabase.from("schools").select("*").eq("school_code", me.schoolCode!).maybeSingle()).data,
  });

  const { data: students = [] } = useQuery({
    enabled: !!me.schoolCode,
    queryKey: ["school-students", me.schoolCode],
    queryFn: async () =>
      (await supabase.from("students").select("tsid,fullname,level,gender,status,created_at").eq("school_code", me.schoolCode!).order("created_at", { ascending: false })).data ?? [],
  });

  const { data: pendingApps = [] } = useQuery({
    enabled: !!me.schoolCode,
    queryKey: ["school-pending-apps", me.schoolCode],
    queryFn: async () => (await supabase.from("letter_requests").select("id").eq("school_code", me.schoolCode!).eq("status", "pending")).data ?? [],
  });

  const ladder = useMemo(() => levelsForSchoolType(school?.type), [school?.type]);

  // Filtered set by grade
  const filtered = useMemo(
    () => gradeFilter === "all" ? students : students.filter((s) => (s.level ?? "Unset") === gradeFilter),
    [students, gradeFilter]
  );

  // Status counts (on filtered)
  const statusCounts = useMemo(() => {
    const m: Record<string, number> = {};
    filtered.forEach((s) => { const k = (s.status ?? "active").toLowerCase(); m[k] = (m[k] ?? 0) + 1; });
    return m;
  }, [filtered]);

  const active = statusCounts["active"] ?? 0;
  const dropped = statusCounts["dropped"] ?? 0;
  const retention = filtered.length ? Math.round((active / filtered.length) * 100) : 0;

  // By-level breakdown (full ladder order, include zero-count grades)
  const byLevel = useMemo(() => {
    const present = Array.from(new Set(students.map((s) => s.level ?? "Unset")));
    const order = [...ladder.filter((l) => present.includes(l)), ...present.filter((l) => !ladder.includes(l))];
    return order.map((level) => {
      const set = students.filter((s) => (s.level ?? "Unset") === level);
      return {
        level,
        total: set.length,
        active: set.filter((s) => (s.status ?? "active") === "active").length,
        dropped: set.filter((s) => s.status === "dropped").length,
        male: set.filter((s) => (s.gender ?? "").toLowerCase().startsWith("m")).length,
        female: set.filter((s) => (s.gender ?? "").toLowerCase().startsWith("f")).length,
      };
    });
  }, [students, ladder]);

  const pieData = Object.entries(statusCounts).map(([k, v]) => ({ name: k, value: v, fill: STATUS_COLORS[k] ?? "#64748b" }));
  const recent = filtered.slice(0, 6);

  if (!me.loading && !me.schoolCode) {
    return (
      <div className="rounded-2xl border bg-card p-8 max-w-xl">
        <div className="flex items-center gap-2 text-amber-600 font-semibold"><AlertTriangle className="h-5 w-5" /> No school linked</div>
        <p className="mt-2 text-sm text-muted-foreground">Your account isn't linked to a school yet. Contact the government administrator.</p>
      </div>
    );
  }

  const cards = [
    { label: "Total Students", value: filtered.length, icon: Users, color: "#002855" },
    { label: "Active", value: active, icon: UserCheck, color: "#1EB53A" },
    { label: "Dropped", value: dropped, icon: UserX, color: "#dc2626" },
    { label: "Retention", value: `${retention}%`, icon: TrendingUp, color: "#3b82f6" },
    { label: "Pending Letters", value: pendingApps.length, icon: Mail, color: "#f59e0b" },
    { label: "Grade Levels", value: byLevel.length, icon: GraduationCap, color: "#8b5cf6" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-primary text-primary-foreground p-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">School Portal</div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>{school?.school_name ?? "School Dashboard"}</h1>
          <p className="text-sm opacity-80 mt-1">
            {school?.type}{school?.region ? ` · ${school.region}` : ""}{school?.district ? `, ${school.district}` : ""}
            {school?.school_code && <> · Code <span className="font-mono">{school.school_code}</span></>}
          </p>
        </div>
        <Button asChild variant="secondary"><Link to="/school/students"><Plus className="h-4 w-4 mr-2" /> Create Student</Link></Button>
      </div>

      {/* Grade filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-semibold text-muted-foreground">Filter by grade:</span>
        <button onClick={() => setGradeFilter("all")}
          className={`px-3 py-1 rounded-lg text-xs font-semibold ${gradeFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
          All
        </button>
        {byLevel.map((l) => (
          <button key={l.level} onClick={() => setGradeFilter(l.level)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold ${gradeFilter === l.level ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
            {l.level} ({l.total})
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border bg-card p-4">
            <div className="h-9 w-9 rounded-lg flex items-center justify-center text-white" style={{ background: c.color }}><c.icon className="h-4 w-4" /></div>
            <div className="mt-3 text-2xl font-bold">{c.value}</div>
            <div className="text-[11px] text-muted-foreground mt-1 uppercase tracking-wider">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border bg-card p-4">
          <div className="font-semibold text-sm mb-2">Active vs Dropped {gradeFilter !== "all" && `· ${gradeFilter}`}</div>
          {pieData.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e) => `${e.name}: ${e.value}`}>
                  {pieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-2xl border bg-card p-4">
          <div className="font-semibold text-sm mb-2">Students by Grade (Active vs Dropped)</div>
          {byLevel.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={byLevel} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="level" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="active" stackId="a" fill="#1EB53A" name="Active" />
                <Bar dataKey="dropped" stackId="a" fill="#dc2626" name="Dropped" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Grade breakdown table */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b font-semibold text-sm">Enrollment by Grade / Level</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left">Grade / Level</th>
                <th className="px-4 py-2 text-right">Total</th>
                <th className="px-4 py-2 text-right">Active</th>
                <th className="px-4 py-2 text-right">Dropped</th>
                <th className="px-4 py-2 text-right">Male</th>
                <th className="px-4 py-2 text-right">Female</th>
              </tr>
            </thead>
            <tbody>
              {byLevel.map((l) => (
                <tr key={l.level} className="border-t hover:bg-muted/20 cursor-pointer" onClick={() => setGradeFilter(l.level)}>
                  <td className="px-4 py-2 font-medium">{l.level}</td>
                  <td className="px-4 py-2 text-right font-bold">{l.total}</td>
                  <td className="px-4 py-2 text-right text-emerald-600">{l.active}</td>
                  <td className="px-4 py-2 text-right text-red-600">{l.dropped}</td>
                  <td className="px-4 py-2 text-right">{l.male}</td>
                  <td className="px-4 py-2 text-right">{l.female}</td>
                </tr>
              ))}
              {byLevel.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No students yet.</td></tr>}
            </tbody>
            {byLevel.length > 0 && (
              <tfoot className="border-t-2 font-bold bg-muted/30">
                <tr>
                  <td className="px-4 py-2">Total</td>
                  <td className="px-4 py-2 text-right">{students.length}</td>
                  <td className="px-4 py-2 text-right text-emerald-600">{byLevel.reduce((a, b) => a + b.active, 0)}</td>
                  <td className="px-4 py-2 text-right text-red-600">{byLevel.reduce((a, b) => a + b.dropped, 0)}</td>
                  <td className="px-4 py-2 text-right">{byLevel.reduce((a, b) => a + b.male, 0)}</td>
                  <td className="px-4 py-2 text-right">{byLevel.reduce((a, b) => a + b.female, 0)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Recent */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <span className="font-semibold text-sm">Recently Registered {gradeFilter !== "all" && `· ${gradeFilter}`}</span>
          <Link to="/school/students" className="text-xs text-primary hover:underline">View all →</Link>
        </div>
        {recent.length === 0 ? <p className="px-4 py-8 text-sm text-center text-muted-foreground">No students.</p> : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="px-4 py-2 text-left">Name</th><th className="px-4 py-2 text-left">TSID</th><th className="px-4 py-2 text-left">Level</th><th className="px-4 py-2 text-left">Status</th></tr>
            </thead>
            <tbody>
              {recent.map((st) => (
                <tr key={st.tsid} className="border-t">
                  <td className="px-4 py-2 font-medium">{st.fullname}</td>
                  <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{st.tsid}</td>
                  <td className="px-4 py-2 text-xs">{st.level ?? "—"}</td>
                  <td className="px-4 py-2 text-xs capitalize" style={{ color: STATUS_COLORS[(st.status ?? "active").toLowerCase()] ?? "#64748b" }}>{st.status ?? "active"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Empty() {
  return <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">No data yet.</div>;
}
