import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMyStudents } from "./teacher.index";
import { StudentProfileDrawer } from "@/components/tsid/student-profile-drawer";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/teacher/students")({ component: Page });

function Page() {
  const { data: students = [] } = useMyStudents();
  const [q, setQ] = useState("");
  const [tsid, setTsid] = useState<string | null>(null);
  const filtered = students.filter((s: any) =>
    !q || s.fullname.toLowerCase().includes(q.toLowerCase()) || s.tsid.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>My Students</h1>
        <p className="text-sm text-muted-foreground">Students in your assigned classes.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search name or TSID" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="rounded-2xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="px-4 py-2 text-left">Name</th><th className="px-4 py-2 text-left">TSID</th><th className="px-4 py-2 text-left">Class</th><th className="px-4 py-2 text-left">Status</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">No students.</td></tr>}
            {filtered.map((s: any) => (
              <tr key={s.tsid} className="border-t hover:bg-muted/20 cursor-pointer" onClick={() => setTsid(s.tsid)}>
                <td className="px-4 py-2 font-medium">{s.fullname}</td>
                <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{s.tsid}</td>
                <td className="px-4 py-2 text-xs">{s.level}</td>
                <td className="px-4 py-2 text-xs capitalize">{s.status ?? "active"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tsid && <StudentProfileDrawer tsid={tsid} viewerRole="school" onClose={() => setTsid(null)} />}
    </div>
  );
}
