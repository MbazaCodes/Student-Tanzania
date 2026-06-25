import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";
import { X, Pencil, Save, ShieldAlert, KeyRound, Trash2, Copy } from "lucide-react";
import {
  diffFields, classifyStudentChanges, submitChangeRequest,
  STUDENT_MAJOR_FIELDS, STUDENT_MINOR_FIELDS,
} from "@/lib/change-requests";
import { studentCompleteness } from "@/lib/completeness";
import { CompletenessBanner } from "@/components/tsid/completeness-banner";
import { PhotoUpload } from "@/components/tsid/photo-upload";
import { NATIONALITIES, RELATIONSHIPS, levelsForSchoolType } from "@/lib/tz-geo";

type Student = Record<string, any>;

export function StudentProfileDrawer({ tsid, viewerRole, onClose, onChanged }: {
  tsid: string;
  viewerRole: "student" | "school" | "admin";
  onClose: () => void;
  onChanged?: () => void;
}) {
  const me = useCurrentUser();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Student>({});
  const [saving, setSaving] = useState(false);

  const { data: student, isLoading, refetch } = useQuery({
    queryKey: ["student-profile", tsid],
    queryFn: async () => (await supabase.from("students").select("*").eq("tsid", tsid).maybeSingle()).data as Student | null,
  });

  const isGovAdmin = me.tier === 0 || me.tier === 1 || me.tier === 2;
  const isSchool = viewerRole === "school";
  const completeness = studentCompleteness(student);

  function startEdit() { setDraft({ ...student }); setEditing(true); }

  async function save() {
    if (!student) return;
    setSaving(true);
    const editable = [...STUDENT_MAJOR_FIELDS, ...STUDENT_MINOR_FIELDS, "level", "gender", "nationality", "enrollment_date", "photo"];
    const changes = diffFields(student, draft, editable);
    if (Object.keys(changes).length === 0) { toast.message("No changes."); setSaving(false); setEditing(false); return; }

    if (isGovAdmin) {
      const updates: Record<string, unknown> = {};
      for (const [f, v] of Object.entries(changes)) updates[f] = v.new;
      const { error } = await supabase.from("students").update(updates).eq("tsid", tsid);
      if (error) { toast.error(error.message); setSaving(false); return; }
      await supabase.from("activity_logs").insert({ action: "student:edit", message: `Edited ${tsid}`, by_name: me.fullName ?? "Admin", by_role: me.role ?? "gov", by_ref: tsid });
      toast.success("Saved"); setSaving(false); setEditing(false); refetch(); onChanged?.(); return;
    }

    const { major, minor } = classifyStudentChanges(changes);
    let submitted = 0;

    if (Object.keys(minor).length > 0) {
      if (isSchool) {
        const updates: Record<string, unknown> = {};
        for (const [f, v] of Object.entries(minor)) updates[f] = v.new;
        const { error } = await supabase.from("students").update(updates).eq("tsid", tsid);
        if (error) { toast.error(error.message); setSaving(false); return; }
      } else {
        await submitChangeRequest({
          entity: "student", entity_ref: tsid, entity_name: student.fullname,
          severity: "minor", approver_level: "school", changes: minor,
          requested_by: me.userId!, requested_by_name: me.fullName ?? "Student", requested_by_role: me.role ?? "student",
          region: student.region, district: student.district, school_code: student.school_code,
        });
        submitted++;
      }
    }
    if (Object.keys(major).length > 0) {
      await submitChangeRequest({
        entity: "student", entity_ref: tsid, entity_name: student.fullname,
        severity: "major", approver_level: "admin", changes: major,
        requested_by: me.userId!, requested_by_name: me.fullName ?? "Student", requested_by_role: me.role ?? "student",
        region: student.region, district: student.district, school_code: student.school_code,
      });
      submitted++;
    }
    setSaving(false); setEditing(false); refetch(); onChanged?.();
    toast.success(submitted > 0 ? "Change request submitted for approval" : "Saved");
  }

  const canEdit = viewerRole === "student" || isSchool || isGovAdmin;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", justifyContent: "flex-end" }}>
      <div style={{ flex: 1, background: "rgba(0,0,0,.4)" }} onClick={onClose} />
      <div style={{ width: 480, maxWidth: "100%", background: "var(--card)", height: "100%", overflowY: "auto", boxShadow: "-8px 0 24px rgba(0,0,0,.15)" }}>
        <div style={{ position: "sticky", top: 0, background: "var(--card)", borderBottom: "1px solid var(--border)", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 1 }}>
          <div className="font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>Student Profile</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X className="h-5 w-5" /></button>
        </div>

        {isLoading ? <div className="p-8 text-center text-muted-foreground text-sm">Loading…</div>
        : !student ? <div className="p-8 text-center text-muted-foreground text-sm">Not found.</div>
        : (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-4">
              {student.photo
                ? <img src={student.photo} className="w-16 h-20 object-cover rounded-lg border" alt="" />
                : <div className="w-16 h-20 rounded-lg border bg-muted flex items-center justify-center text-2xl">👤</div>}
              <div>
                <div className="font-bold text-lg">{student.fullname}</div>
                <div className="font-mono text-xs text-primary">{student.tsid}</div>
                <span className={`inline-flex mt-1 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${student.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>{student.status}</span>
              </div>
            </div>

            {!editing && <CompletenessBanner result={completeness} entityLabel="student profile" onComplete={canEdit ? startEdit : undefined} />}

            {!editing && !student.auth_uid && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                This student has no login account (registered before login was enabled). They can't log in and their password can't be reset. Delete and re-register to enable login.
              </div>
            )}

            {!editing && (
              <div className="space-y-2">
                {canEdit && (
                  <Button variant="outline" className="w-full" onClick={startEdit}>
                    <Pencil className="h-3.5 w-3.5 mr-2" /> Edit profile
                  </Button>
                )}
                {isSchool && (
                  <div className="flex gap-2">
                    <ResetStudentPassword tsid={tsid} />
                    <RequestDeleteStudent student={student} me={me} onDone={onChanged} />
                  </div>
                )}
                {/* Gov admins: reset password + force delete (National). */}
                {isGovAdmin && (
                  <div className="flex gap-2">
                    <ResetStudentPassword tsid={tsid} />
                    {me.tier === 0 && (
                      <ForceDeleteStudent student={student} onDone={() => { onChanged?.(); onClose(); }} />
                    )}
                  </div>
                )}
              </div>
            )}

            {editing
              ? <EditForm draft={draft} setDraft={setDraft} viewerRole={viewerRole} isGovAdmin={isGovAdmin} student={student} />
              : <Details student={student} />}

            {editing && (
              <div className="flex gap-2 sticky bottom-0 bg-card pt-3 border-t">
                <Button variant="outline" className="flex-1" onClick={() => setEditing(false)}>Cancel</Button>
                <Button className="flex-1 bg-primary" onClick={save} disabled={saving}>
                  <Save className="h-3.5 w-3.5 mr-1" /> {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Details({ student }: { student: Student }) {
  const rows: [string, any][] = [
    ["Level", student.level], ["Date of Birth", student.dob], ["Gender", student.gender],
    ["Blood Group", student.blood_group], ["Nationality", student.nationality],
    ["School", student.school_name], ["Region", student.region], ["District", student.district],
    ["Ward", student.ward], ["Parent / Guardian", student.parent_name],
    ["Relationship", student.relationship], ["Parent Phone", student.parent_phone],
    ["Parent NIDA", student.parent_nida], ["Enrollment", student.enrollment_date],
  ];
  return (
    <div className="rounded-xl border divide-y">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between px-3 py-2 text-sm">
          <span className="text-muted-foreground">{k}</span>
          <span className="font-medium text-right">{v || <span className="text-red-500">— missing</span>}</span>
        </div>
      ))}
    </div>
  );
}

function EditForm({ draft, setDraft, viewerRole, isGovAdmin, student }: {
  draft: Student; setDraft: (s: Student) => void; viewerRole: string; isGovAdmin: boolean; student: Student;
}) {
  const set = (k: string, v: any) => setDraft({ ...draft, [k]: v });
  return (
    <div className="space-y-3">
      {!isGovAdmin && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 flex items-start gap-2">
          <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
          {viewerRole === "student"
            ? "Major changes (name, DOB) need admin approval; minor changes need school approval."
            : "Major changes (name, DOB) need admin approval; minor changes apply immediately."}
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Profile Photo</Label>
        <PhotoUpload currentUrl={draft.photo} pathPrefix={`students/${student.tsid}`} shape="portrait"
          onUploaded={(url) => set("photo", url)} label="Upload photo" />
      </div>

      <div className="space-y-1.5"><Label>Full Name (major)</Label><Input value={draft.fullname ?? ""} onChange={(e) => set("fullname", e.target.value)} /></div>
      <div className="space-y-1.5"><Label>Date of Birth (major)</Label><Input type="date" value={draft.dob ?? ""} onChange={(e) => set("dob", e.target.value)} /></div>

      <div className="space-y-1.5"><Label>Current Level</Label>
        <Select value={draft.level ?? ""} onValueChange={(v) => set("level", v)}>
          <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
          <SelectContent>{levelsForSchoolType(student.school_type ?? "Primary School").map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5"><Label>Nationality</Label>
        <Select value={draft.nationality ?? ""} onValueChange={(v) => set("nationality", v)}>
          <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
          <SelectContent>{NATIONALITIES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5"><Label>Blood Group (minor)</Label><Input value={draft.blood_group ?? ""} onChange={(e) => set("blood_group", e.target.value)} /></div>
      <div className="space-y-1.5"><Label>Enrollment Date</Label><Input type="date" value={draft.enrollment_date ?? ""} onChange={(e) => set("enrollment_date", e.target.value)} /></div>
      <div className="space-y-1.5"><Label>Parent / Guardian (minor)</Label><Input value={draft.parent_name ?? ""} onChange={(e) => set("parent_name", e.target.value)} /></div>
      <div className="space-y-1.5"><Label>Relationship (minor)</Label>
        <Select value={draft.relationship ?? ""} onValueChange={(v) => set("relationship", v)}>
          <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
          <SelectContent>{RELATIONSHIPS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5"><Label>Parent Phone (minor)</Label><Input value={draft.parent_phone ?? ""} onChange={(e) => set("parent_phone", e.target.value)} /></div>
      <div className="space-y-1.5"><Label>Parent NIDA (minor)</Label><Input value={draft.parent_nida ?? ""} onChange={(e) => set("parent_nida", e.target.value)} /></div>
    </div>
  );
}

function ResetStudentPassword({ tsid }: { tsid: string }) {
  const [loading, setLoading] = useState(false);
  const [pw] = useState(() => "tsid" + Math.random().toString(36).slice(2, 8));
  const [done, setDone] = useState(false);
  async function reset() {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("manage-admin", {
      body: { action: "reset_student_password", tsid, new_password: pw },
    });
    setLoading(false);
    if (error || data?.error) { toast.error(data?.error ?? error?.message ?? "Failed"); return; }
    setDone(true); toast.success("Student password reset");
  }
  return (
    <div className="flex-1">
      {done ? (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-xs flex items-center justify-between font-mono">
          {pw}
          <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(pw); toast.success("Copied"); }}><Copy className="h-3 w-3" /></Button>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="w-full" onClick={reset} disabled={loading}>
          <KeyRound className="h-3.5 w-3.5 mr-1" /> {loading ? "…" : "Reset password"}
        </Button>
      )}
    </div>
  );
}

function RequestDeleteStudent({ student, me, onDone }: { student: Student; me: any; onDone?: () => void }) {
  const [loading, setLoading] = useState(false);
  async function request() {
    setLoading(true);
    const { error } = await supabase.from("change_requests").insert({
      entity: "student", entity_ref: student.tsid, entity_name: student.fullname,
      severity: "major", approver_level: "admin", request_type: "delete",
      changes: { _delete: { old: "active", new: "deleted" } },
      requested_by: me.userId, requested_by_name: me.fullName ?? "School", requested_by_role: me.role ?? "school",
      region: student.region, district: student.district, school_code: student.school_code, status: "pending",
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Delete request sent for admin approval");
    onDone?.();
  }
  return (
    <Button variant="outline" size="sm" className="flex-1 text-red-600 border-red-200 hover:bg-red-50" onClick={request} disabled={loading}>
      <Trash2 className="h-3.5 w-3.5 mr-1" /> {loading ? "…" : "Request delete"}
    </Button>
  );
}

// ── National admin: force delete (direct, no approval needed) ──────────────
function ForceDeleteStudent({ student, onDone }: { student: Student; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  async function del() {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("manage-admin", {
      body: { action: "delete_student", tsid: student.tsid },
    });
    setLoading(false);
    if (error || data?.error) { toast.error(data?.error ?? error?.message ?? "Delete failed"); return; }
    toast.success("Student deleted");
    setOpen(false);
    onDone();
  }
  return (
    <>
      <Button variant="outline" size="sm" className="flex-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => setOpen(true)}>
        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
      </Button>
      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)" }} onClick={() => setOpen(false)} />
          <div style={{ position: "relative", background: "var(--card)", borderRadius: 16, padding: 24, width: 400, maxWidth: "90%" }}>
            <div className="font-bold text-lg mb-2">Delete Student</div>
            <p className="text-sm text-muted-foreground mb-4">
              Permanently delete <strong>{student.fullname}</strong> ({student.tsid})? This removes their record and login. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={del} disabled={loading}>
                {loading ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
