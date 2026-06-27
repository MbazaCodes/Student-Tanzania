import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Users, GraduationCap, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/teacher/")({ component: Page });

export function useMyAssignments() {
  const me = useCurrentUser();
  return useQuery({
    enabled: !!me.userId,
    queryKey: ["teacher-assignments", me.userId],
    queryFn: async () => (await supabase.from("teacher_assignments").select("*")).data ?? [],
  });
}

export function useMyStudents() {
  const me = useCurrentUser();
  const { data: assignments = [] } = useMyAssignments();
  return useQuery({
    enabled: !!me.userId && assignments.length > 0,
    queryKey: ["teacher-students", me.userId, assignments.map((a: any) => a.school_code + a.level).join(",")],
    queryFn: async () => {
      const out: any[] = [];
      for (const a of assignments) {
        const { data } = await supabase.from("students")
          .select("tsid,fullname,photo,level,status,school_code,school_name,region,district,talent_primary,disability,school_type,start_year,start_level,enrollment_date")
          .eq("school_code", a.school_code).eq("level", a.level);
        out.push(...(data ?? []));
      }
      // dedupe by tsid
      return Array.from(new Map(out.map((s) => [s.tsid, s])).values());
    },
  });
}

function Page() {
  const me = useCurrentUser();
  const { data: assignments = [] } = useMyAssignments();
  const { data: students = [] } = useMyStudents();
  if (me.loading) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-primary text-primary-foreground p-6">
        <div className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">Teacher / Educator Portal</div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Karibu, {me.fullName ?? "Teacher"}! 👋</h1>
        <p className="text-sm opacity-80 mt-1">
          {assignments.length > 0
            ? `Assigned: ${assignments.map((a: any) => `${a.level} (${a.school_code})`).join(", ")}`
            : "No classes assigned yet. Your school will assign you."}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Stat icon={Users} label="My Students" value={students.length} color="#002855" />
        <Stat icon={GraduationCap} label="Classes" value={assignments.length} color="#1EB53A" />
        <Stat icon={TrendingUp} label="With Talent" value={students.filter((s: any) => s.talent_primary).length} color="#f59e0b" />
      </div>

      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <span className="font-semibold text-sm">My Students</span>
          <Link to="/teacher/students" className="text-xs text-primary hover:underline">Manage →</Link>
        </div>
        <div className="divide-y">
          {students.length === 0 && <div className="p-10 text-center text-muted-foreground text-sm">No students in your assigned classes yet.</div>}
          {students.slice(0, 8).map((s: any) => (
            <Link key={s.tsid} to="/teacher/development" className="flex items-center gap-3 p-3 hover:bg-muted/20">
              <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted border shrink-0 flex items-center justify-center">
                {s.photo ? <img src={s.photo} alt="" className="h-full w-full object-cover" /> : <span>👤</span>}
              </div>
              <div className="min-w-0 flex-1"><div className="font-semibold text-sm truncate">{s.fullname}</div><div className="text-xs text-muted-foreground">{s.level}</div></div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="h-9 w-9 rounded-lg flex items-center justify-center text-white" style={{ background: color }}><Icon className="h-4 w-4" /></div>
      <div className="mt-3 text-3xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{label}</div>
    </div>
  );
}
