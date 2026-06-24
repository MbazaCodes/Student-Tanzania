import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Copy } from "lucide-react";
import { generateTsidNo, sha256Hex } from "@/lib/tsid";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/school/students")({ component: Page });

type Gender = Database["public"]["Enums"]["gender_type"];
const BLOOD_GROUPS = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];

function genStudentPassword() {
  return "tz" + Math.random().toString(36).slice(2,8).toUpperCase() + "!";
}

function Page() {
  const me = useCurrentUser();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: school } = useQuery({
    enabled: !!me.schoolCode,
    queryKey: ["school", me.schoolCode],
    queryFn: async () => (await supabase.from("schools").select("*").eq("code", me.schoolCode!).maybeSingle()).data,
  });

  const { data: students = [] } = useQuery({
    enabled: !!me.schoolCode,
    queryKey: ["school-students-list", me.schoolCode],
    queryFn: async () =>
      (await supabase.from("students").select("tsid,fullname,dob,gender,photo,status,level,cred_username").eq("school_code", me.schoolCode!).order("created_at", { ascending: false })).data ?? [],
  });

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return !q || s.fullname.toLowerCase().includes(q) || s.tsid.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>Student Database</h1>
          <p className="text-sm text-muted-foreground">{students.length} student{students.length !== 1 ? "s" : ""}{school ? ` · ${school.name}` : ""}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary" disabled={!school}><Plus className="h-4 w-4 mr-2" /> Create student</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Register New Student</DialogTitle></DialogHeader>
            {school && (
              <CreateStudentForm
                school={school}
                actorName={me.fullName ?? "School Admin"}
                onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["school-students-list"] }); }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Input className="max-w-sm" placeholder="Search by name or TSID…" value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="px-4 py-3">Photo</th><th className="px-4 py-3">Student</th><th className="px-4 py-3">Level</th><th className="px-4 py-3">DOB / Gender</th><th className="px-4 py-3">Username</th><th className="px-4 py-3">Status</th></tr>
            </thead>
            <tbody>
              {filtered.map((st) => (
                <tr key={st.tsid} className="border-t hover:bg-muted/20">
                  <td className="px-4 py-2">{st.photo ? <img src={st.photo} className="w-9 h-12 object-cover rounded-md border" alt="" /> : <div className="w-9 h-12 rounded-md border bg-muted flex items-center justify-center text-lg">👤</div>}</td>
                  <td className="px-4 py-3"><div className="font-semibold">{st.fullname}</div><div className="text-xs font-mono text-muted-foreground">{st.tsid}</div></td>
                  <td className="px-4 py-3 text-sm">{st.level ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{st.dob ?? "—"} · {st.gender ?? "—"}</td>
                  <td className="px-4 py-3 text-xs font-mono">{st.cred_username}</td>
                  <td className="px-4 py-3"><span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>{st.status}</span></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">{search ? "No matches." : "No students yet."}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

type School = Database["public"]["Tables"]["schools"]["Row"];

function CreateStudentForm({ school, actorName, onDone }: { school: School; actorName: string; onDone: () => void }) {
  const [fullname, setFullname] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<Gender>("Male");
  const [nationality, setNationality] = useState("Tanzanian");
  const [level, setLevel] = useState("");
  const [enrollmentDate, setEnrollmentDate] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [parentName, setParentName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [parentNida, setParentNida] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [password, setPassword] = useState(genStudentPassword());
  const [loading, setLoading] = useState(false);
  const [issued, setIssued] = useState<{ tsid: string; username: string; password: string } | null>(null);

  const [tsid] = useState(() => generateTsidNo());

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullname || !dob || !level) { toast.error("Full name, DOB and level are required."); return; }
    setLoading(true);
    const hash = await sha256Hex(password);
    const { error } = await supabase.from("students").insert({
      tsid, fullname, dob, gender,
      nationality, level,
      school_code: school.code, school_name: school.name,
      region: school.region, district: school.district, ward: school.ward,
      school_contact: school.contact, enrollment_date: enrollmentDate || null,
      blood_group: bloodGroup || null, issue_date: issueDate || null,
      parent_name: parentName || null, parent_nida: parentNida || null,
      relationship: relationship || null, parent_phone: parentPhone || null,
      cred_username: tsid, cred_password: hash, status: "active", remarks: [],
    });
    if (error) { toast.error(error.message); setLoading(false); return; }
    await supabase.from("activity_logs").insert({
      action: "student:register", message: `Registered ${tsid} (${fullname})`,
      by_name: actorName, by_role: "school", by_ref: school.code,
    });
    setLoading(false);
    setIssued({ tsid, username: tsid, password });
    toast.success(`✅ Student ${tsid} created!`);
  }

  if (issued) {
    return (
      <div className="space-y-4 py-2">
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5">
          <div className="font-bold text-emerald-800 mb-3">✅ Student registered</div>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">TSID</span><strong className="text-primary">{issued.tsid}</strong></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Username</span><strong>{issued.username}</strong></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Password</span><strong>{issued.password}</strong></div>
          </div>
          <Button className="mt-4 w-full" variant="outline" onClick={() => {
            navigator.clipboard.writeText(`TSID: ${issued.tsid}\nUsername: ${issued.username}\nPassword: ${issued.password}`);
            toast.success("Copied!");
          }}><Copy className="h-4 w-4 mr-2" /> Copy</Button>
        </div>
        <Button className="w-full bg-primary" onClick={onDone}>Done</Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label>TSID</Label><Input value={tsid} readOnly className="font-mono text-primary font-bold bg-muted/50" /></div>
        <div className="space-y-1.5"><Label>Full Name *</Label><Input value={fullname} onChange={(e) => setFullname(e.target.value)} required /></div>
        <div className="space-y-1.5"><Label>Date of Birth *</Label><Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required /></div>
        <div className="space-y-1.5"><Label>Gender *</Label>
          <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>Nationality</Label><Input value={nationality} onChange={(e) => setNationality(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Blood Group</Label>
          <Select value={bloodGroup} onValueChange={setBloodGroup}>
            <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>{BLOOD_GROUPS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>Current Level *</Label><Input value={level} onChange={(e) => setLevel(e.target.value)} placeholder="e.g. Form 2" required /></div>
        <div className="space-y-1.5"><Label>Enrollment Date</Label><Input type="date" value={enrollmentDate} onChange={(e) => setEnrollmentDate(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Issue Date</Label><Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Parent / Guardian</Label><Input value={parentName} onChange={(e) => setParentName(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Relationship</Label><Input value={relationship} onChange={(e) => setRelationship(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Parent NIDA (20 digits)</Label><Input value={parentNida} onChange={(e) => setParentNida(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Parent Phone</Label><Input value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} placeholder="+255 7XX XXX XXX" /></div>
      </div>
      <div className="rounded-xl border bg-muted/30 p-4 text-sm">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">School (auto)</div>
        <div className="grid grid-cols-2 gap-2"><div><span className="text-muted-foreground">Name: </span>{school.name}</div><div><span className="text-muted-foreground">Code: </span><span className="font-mono text-primary">{school.code}</span></div><div><span className="text-muted-foreground">Region: </span>{school.region}</div><div><span className="text-muted-foreground">District: </span>{school.district}</div></div>
      </div>
      <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
        <div className="text-xs font-bold text-blue-800 uppercase tracking-wider">🔑 Login</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Username</Label><Input value={tsid} readOnly className="font-mono bg-muted/50" /></div>
          <div className="space-y-1.5"><Label>Password</Label><Input className="font-mono" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setPassword(genStudentPassword())}>↻ New password</Button>
      </div>
      <Button type="submit" className="w-full bg-primary" disabled={loading}>{loading ? "Creating…" : "Create student"}</Button>
    </form>
  );
}