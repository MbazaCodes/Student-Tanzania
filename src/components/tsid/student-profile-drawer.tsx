import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";
import { X, Pencil, Save, ShieldAlert } from "lucide-react";
import {
  diffFields, classifyStudentChanges, submitChangeRequest,
  STUDENT_MAJOR_FIELDS, STUDENT_MINOR_FIELDS, fieldLabel,
} from "@/lib/change-requests";

type Student = Record<string, any>;

/**
 * Slide-in student profile. View for all; edit routes changes through the
 * approval workflow:
 *   - viewerRole 'student'        → major→admin, minor→school
 *   - viewerRole 'school'         → can directly apply minor; major→admin
 *   - viewerRole 'admin'/'gov*'   → can apply anything directly
 */
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
    queryFn: async () => {
      const { data } = await supabase.from("students").select("*").eq("tsid", tsid).maybeSingle();
      return data as Student | null;
    },
  });

  const isGovAdmin = me.tier === 0 || me.tier === 1 || me.tier === 2;

  function startEdit() {
    setDraft({ ...student });
    setEditing(true);
  }

  async function save() {
    if (!student) return;
    setSaving(true);

    const editableFields = [...STUDENT_MAJOR_FIELDS, ...STUDENT_MINOR_FIELDS];
    const changes = diffFields(student, draft, editableFields);
    if (Object.keys(changes).length === 0) {
      toast.message("No changes."); setSaving(false); setEditing(false); return;
    }

    // Gov admins apply directly
    if (isGovAdmin) {
      const updates: Record<string, unknown> = {};
      for (const [f, v] of Object.entries(changes)) updates[f] = v.new;
      const { error } = await supabase.from("students").update(updates).eq("tsid", tsid);
      if (error) { toast.error(error.message); setSaving(false); return; }
      await supabase.from("activity_logs").insert({
        action: "student:edit", message: `Edited ${tsid}`,
        by_name: me.fullName ?? "Admin", by_role: me.role ?? "gov", by_ref: tsid,
      });
      toast.success("Saved");
      setSaving(false); setEditing(false); refetch(); onChanged?.();
      return;
    }

    const { major, minor } = classifyStudentChanges(changes);
    let submitted = 0;

    // Minor: school applies directly if viewer is the school; otherwise request to school
    if (Object.keys(minor).length > 0) {
      if (viewerRole === "school") {
        const updates: Record<string, unknown> = {};
        for (const [f, v] of Object.entries(minor)) updates[f] = v.new;
        const { error } = await supabase.from("students").update(updates).eq("tsid", tsid);
        if (error) { toast.error(error.message); setSaving(false); return; }
      } else {
        await submitChangeRequest({
          entity: "student", entity_ref: tsid, entity_name: student.fullname,
          severity: "minor", approver_level: "school", changes: minor,
          requested_by: me.userId!, requested_by_name: me.fullName ?? "Student",
          requested_by_role: me.role ?? "student",
          region: student.region, district: student.district, school_code: student.school_code,
        });
        submitted++;
      }
    }

    // Major: always request → admin approval
    if (Object.keys(major).length > 0) {
      await submitChangeRequest({
        entity: "student", entity_ref: tsid, entity_name: student.fullname,
        severity: "major", approver_level: "admin", changes: major,
        requested_by: me.userId!, requested_by_name: me.fullName ?? "Student",
        requested_by_role: me.role ?? "student",
        region: student.region, district: student.district, school_code: student.school_code,
      });
      submitted++;
    }

    setSaving(false); setEditing(false); refetch(); onChanged?.();
    if (submitted > 0) toast.success("Change request submitted for approval");
    else toast.success("Saved");
  }

  const canEdit = viewerRole === "student" || viewerRole === "school" || isGovAdmin;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", justifyContent: "flex-end" }}>
      <div style={{ flex: 1, background: "rgba(0,0,0,.4)" }} onClick={onClose} />
      <div style={{ width: 460, maxWidth: "100%", background: "var(--card)", height: "100%", overflowY: "auto", boxShadow: "-8px 0 24px rgba(0,0,0,.15)" }}>
        {/* Header */}
        <div style={{ position: "sticky", top: 0, background: "var(--card)", borderBottom: "1px solid var(--border)", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 1 }}>
          <div className="font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>Student Profile</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X className="h-5 w-5" /></button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading…</div>
        ) : !student ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Not found.</div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Photo + name */}
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

            {!editing && canEdit && (
              <Button variant="outline" className="w-full" onClick={startEdit}>
                <Pencil className="h-3.5 w-3.5 mr-2" /> Edit profile
              </Button>
            )}

            {editing ? (
              <EditForm draft={draft} setDraft={setDraft} viewerRole={viewerRole} isGovAdmin={isGovAdmin} />
            ) : (
              <Details student={student} />
            )}

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
          <span className="font-medium text-right">{v || "—"}</span>
        </div>
      ))}
    </div>
  );
}

function EditForm({ draft, setDraft, viewerRole, isGovAdmin }: {
  draft: Student; setDraft: (s: Student) => void; viewerRole: string; isGovAdmin: boolean;
}) {
  const set = (k: string, v: any) => setDraft({ ...draft, [k]: v });
  const fields = [
    { k: "fullname", label: "Full Name (major)", major: true },
    { k: "dob", label: "Date of Birth (major)", major: true, type: "date" },
    { k: "parent_name", label: "Parent / Guardian (minor)" },
    { k: "parent_phone", label: "Parent Phone (minor)" },
    { k: "parent_nida", label: "Parent NIDA (minor)" },
    { k: "blood_group", label: "Blood Group (minor)" },
  ];
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
      {fields.map((f) => (
        <div key={f.k} className="space-y-1.5">
          <Label>{f.label}</Label>
          <Input type={f.type ?? "text"} value={draft[f.k] ?? ""} onChange={(e) => set(f.k, e.target.value)} />
        </div>
      ))}
    </div>
  );
}
