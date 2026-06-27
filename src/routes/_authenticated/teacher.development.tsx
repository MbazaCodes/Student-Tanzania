import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useMyStudents } from "./teacher.index";
import { Input } from "@/components/ui/input";
import { Search, TrendingUp } from "lucide-react";
import { DevelopmentPanel } from "@/components/tsid/development-panel";
import { FieldAttachmentPanel } from "@/components/tsid/field-attachment-panel";
import { isTertiary } from "@/lib/development";

export const Route = createFileRoute("/_authenticated/teacher/development")({ component: Page });

function Page() {
  const { data: students = [] } = useMyStudents();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<any | null>(null);

  const matches = useMemo(() => {
    if (!q.trim()) return [];
    const v = q.toLowerCase();
    return students.filter((s: any) =>
      s.fullname.toLowerCase().includes(v) ||
      s.tsid.toLowerCase().includes(v) ||
      (s.level ?? "").toLowerCase().includes(v)
    ).slice(0, 8);
  }, [q, students]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-primary text-primary-foreground p-6">
        <div className="flex items-center gap-2"><TrendingUp className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Development Tool</h1>
            <p className="text-sm opacity-80">Search a student in your class and record their development.</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search student by name, TSID, or class…" value={q}
          onChange={(e) => { setQ(e.target.value); setSelected(null); }} />
        {matches.length > 0 && !selected && (
          <div className="absolute z-10 mt-1 w-full rounded-xl border bg-card shadow-lg overflow-hidden">
            {matches.map((s: any) => (
              <button key={s.tsid} onClick={() => { setSelected(s); setQ(s.fullname); }}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted/40 text-left">
                <div className="h-9 w-9 rounded-lg overflow-hidden bg-muted border shrink-0 flex items-center justify-center">
                  {s.photo ? <img src={s.photo} alt="" className="h-full w-full object-cover" /> : <span>👤</span>}
                </div>
                <div className="min-w-0"><div className="font-semibold text-sm truncate">{s.fullname}</div><div className="text-xs text-muted-foreground">{s.tsid} · {s.level}</div></div>
              </button>
            ))}
          </div>
        )}
      </div>

      {!selected && <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground text-sm">Search and select a student to record development.</div>}

      {selected && (
        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-4 flex items-center gap-3">
            <div className="h-14 w-14 rounded-xl overflow-hidden bg-muted border shrink-0 flex items-center justify-center">
              {selected.photo ? <img src={selected.photo} alt="" className="h-full w-full object-cover" /> : <span className="text-xl">👤</span>}
            </div>
            <div><div className="font-bold">{selected.fullname}</div><div className="font-mono text-xs text-muted-foreground">{selected.tsid} · {selected.level}</div></div>
          </div>

          <div className="rounded-2xl border bg-card p-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">📈 Development & Remarks</div>
            <DevelopmentPanel student={selected} canEdit={true} />
          </div>

          {isTertiary({ schoolType: selected.school_type, level: selected.level }) && (
            <div className="rounded-2xl border bg-card p-4">
              <FieldAttachmentPanel student={selected} canEdit={true} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
