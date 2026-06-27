import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Copy, GraduationCap, UserPlus } from "lucide-react";
import { levelsForSchoolType } from "@/lib/tz-geo";

export const Route = createFileRoute("/_authenticated/school/teachers")({ component: Page });

const ROLE_TITLES = ["Class Teacher", "Subject Teacher", "Instructor", "Dean", "Head of Department"];

function genPass() { return Math.random().toString(36).slice(2, 10); }

function Page() {
  const me = useCurrentUser();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: school } = useQuery({
    enabled: !!me.schoolCode,
    queryKey: ["school", me.schoolCode],
    queryFn: async () => (await supabase.from("schools").select("*").eq("school_code", me.schoolCode!).maybeSingle()).data,
  });

  const { data: assignments = [] } = useQuery({
    enabled: !!me.schoolCode,
    queryKey: ["school-teachers", me.schoolCode],
    queryFn: async () => (await supabase.from("teacher_assignments").select("*").eq("school_code", me.schoolCode!).order("level")).data ?? [],
  });

  // group by teacher
  const byTeacher = Object.values(assignments.reduce((acc: any, a: any) => {
    (acc[a.teacher_ref] ??= { teacher_ref: a.teacher_ref, role_title: a.role_title, levels: [], ids: [] });
    acc[a.teacher_ref].levels.push(a.level);
    acc[a.teacher_ref].ids.push(a.id);
    return acc;
  }, {}));

  async function removeAssignment(id: string) {
    if (!confirm("Remove this class assignment?")) return;
    const { error } = await supabase.from("teacher_assignments").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Removed");
    qc.invalidateQueries({ queryKey: ["school-teachers"] });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-primary text-primary-foreground p-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">Teachers / Educators</div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Manage Teachers</h1>
          <p className="text-sm opacity-80 mt-1">Create teachers and assign them to classes to monitor student development.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="secondary"><UserPlus className="h-4 w-4 mr-2" /> Add Teacher</Button></DialogTrigger>
          <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add Teacher / Educator</DialogTitle></DialogHeader>
            {school && <TeacherForm school={school} onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["school-teachers"] }); }} />}
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {byTeacher.length === 0 && <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground text-sm">No teachers yet. Add one to get started.</div>}
        {byTeacher.map((t: any) => (
          <div key={t.teacher_ref} className="rounded-2xl border bg-card p-4">
            <div className="flex items-center gap-2 font-semibold"><GraduationCap className="h-4 w-4 text-primary" /> {t.teacher_ref}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{t.role_title ?? "Teacher"}</div>
            <div className="flex flex-wrap gap-2 mt-2">
              {t.levels.map((lv: string, i: number) => (
                <span key={i} className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-muted">
                  {lv}
                  <button onClick={() => removeAssignment(t.ids[i])} className="text-red-500 hover:text-red-700"><Trash2 className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeacherForm({ school, onDone }: { school: any; onDone: () => void }) {
  const ladder = levelsForSchoolType(school.type);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState(genPass());
  const [roleTitle, setRoleTitle] = useState(ROLE_TITLES[0]);
  const [levels, setLevels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [issued, setIssued] = useState<{ email: string; password: string } | null>(null);

  function toggleLevel(l: string) { setLevels((p) => p.includes(l) ? p.filter((x) => x !== l) : [...p, l]); }

  async function submit() {
    if (!name || !email) { toast.error("Name and email required"); return; }
    if (levels.length === 0) { toast.error("Assign at least one class"); return; }
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("create-teacher", {
      body: { name, email: email.trim(), password, phone: phone || null, role_title: roleTitle,
        school_code: school.school_code, levels, region: school.region, district: school.district },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    if (data?.error) { toast.error(data.error); return; }
    setIssued({ email: email.trim(), password });
    toast.success("Teacher created & assigned");
  }

  if (issued) {
    return (
      <div className="space-y-4 py-2">
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5">
          <div className="font-bold text-emerald-800 mb-3">✅ Teacher created</div>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><strong>{issued.email}</strong></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Password</span><strong>{issued.password}</strong></div>
          </div>
          <Button className="mt-4 w-full" variant="outline" onClick={() => { navigator.clipboard.writeText(`Teacher login\nEmail: ${issued.email}\nPassword: ${issued.password}`); toast.success("Copied!"); }}><Copy className="h-4 w-4 mr-2" /> Copy</Button>
        </div>
        <Button className="w-full bg-primary" onClick={onDone}>Done</Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 py-1">
      <div className="space-y-1.5"><Label>Full Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="space-y-1.5"><Label>Email (login) *</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Password</Label><Input value={password} onChange={(e) => setPassword(e.target.value)} /></div>
      </div>
      <div className="space-y-1.5"><Label>Title</Label>
        <Select value={roleTitle} onValueChange={setRoleTitle}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{ROLE_TITLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Assign Classes *</Label>
        <div className="flex flex-wrap gap-2">
          {ladder.map((l) => (
            <button key={l} type="button" onClick={() => toggleLevel(l)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${levels.includes(l) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
              {l}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">The teacher will manage development for all students in the selected classes.</p>
      </div>
      <Button className="w-full bg-primary" onClick={submit} disabled={loading}>{loading ? "Creating…" : "Create Teacher"}</Button>
    </div>
  );
}
