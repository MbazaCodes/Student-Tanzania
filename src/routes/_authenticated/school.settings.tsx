import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";
import { Pencil, Save } from "lucide-react";
import { schoolCompleteness } from "@/lib/completeness";
import { CompletenessBanner } from "@/components/tsid/completeness-banner";
import { PhotoUpload } from "@/components/tsid/photo-upload";
import { diffFields, submitChangeRequest } from "@/lib/change-requests";

export const Route = createFileRoute("/_authenticated/school/settings")({ component: Page });

// School edits → admin approval (a school profile change is significant)
const SCHOOL_EDITABLE = ["school_name", "address", "phone", "email", "logo", "ward"];

function Page() {
  const me = useCurrentUser();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const { data: school, refetch } = useQuery({
    enabled: !!me.schoolCode,
    queryKey: ["school-settings", me.schoolCode],
    queryFn: async () => (await supabase.from("schools").select("*").eq("school_code", me.schoolCode!).maybeSingle()).data,
  });

  const completeness = schoolCompleteness(school);

  function startEdit() { setDraft({ ...school }); setEditing(true); }

  async function save() {
    if (!school) return;
    setSaving(true);
    const changes = diffFields(school, draft, SCHOOL_EDITABLE);
    if (Object.keys(changes).length === 0) { toast.message("No changes."); setSaving(false); setEditing(false); return; }

    // Logo is minor → apply immediately; rest → admin approval
    const logoChange = changes.logo;
    const otherChanges = { ...changes }; delete otherChanges.logo;

    if (logoChange) {
      await supabase.from("schools").update({ logo: logoChange.new }).eq("school_code", school.school_code);
    }
    if (Object.keys(otherChanges).length > 0) {
      await submitChangeRequest({
        entity: "school", entity_ref: school.school_code, entity_name: school.school_name,
        severity: "major", approver_level: "admin", changes: otherChanges,
        requested_by: me.userId!, requested_by_name: me.fullName ?? "School", requested_by_role: "school",
        region: school.region, district: school.district, school_code: school.school_code,
      });
      toast.success("Profile changes submitted for admin approval");
    } else {
      toast.success("Logo updated");
    }
    setSaving(false); setEditing(false); refetch(); qc.invalidateQueries({ queryKey: ["school-settings"] });
  }

  const set = (k: string, v: any) => setDraft({ ...draft, [k]: v });

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>Settings</h1>
        {!editing && school && (
          <Button variant="outline" onClick={startEdit}><Pencil className="h-3.5 w-3.5 mr-2" /> Edit profile</Button>
        )}
      </div>

      {school && <CompletenessBanner result={completeness} entityLabel="school profile" onComplete={!editing ? startEdit : undefined} />}

      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">School profile</div>

        {!school ? <p className="text-sm text-muted-foreground">No school linked.</p>
        : editing ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>School Logo / Photo</Label>
              <PhotoUpload currentUrl={draft.logo} pathPrefix={`schools/${school.school_code}`} shape="square"
                onUploaded={(url) => set("logo", url)} label="Upload logo" />
            </div>
            <div className="space-y-1.5"><Label>School Name (needs approval)</Label><Input value={draft.school_name ?? ""} onChange={(e) => set("school_name", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Address (needs approval)</Label><Input value={draft.address ?? ""} onChange={(e) => set("address", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Contact Phone (needs approval)</Label><Input value={draft.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Contact Email (needs approval)</Label><Input type="email" value={draft.email ?? ""} onChange={(e) => set("email", e.target.value)} /></div>
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" className="flex-1" onClick={() => setEditing(false)}>Cancel</Button>
              <Button className="flex-1 bg-primary" onClick={save} disabled={saving}><Save className="h-3.5 w-3.5 mr-1" /> {saving ? "Saving…" : "Save"}</Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-4">
            {school.logo
              ? <img src={school.logo} className="w-20 h-20 rounded-lg object-cover border shrink-0" alt="" />
              : <div className="w-20 h-20 rounded-lg border bg-muted flex items-center justify-center text-2xl shrink-0">🏫</div>}
            <dl className="grid grid-cols-2 gap-3 text-sm flex-1">
              <div><dt className="text-muted-foreground">Code</dt><dd className="font-mono font-bold text-primary">{school.school_code}</dd></div>
              <div><dt className="text-muted-foreground">Login</dt><dd className="font-mono">{school.cred_username}</dd></div>
              <div className="col-span-2"><dt className="text-muted-foreground">Name</dt><dd className="font-semibold">{school.school_name}</dd></div>
              <div><dt className="text-muted-foreground">Type</dt><dd>{school.type}</dd></div>
              <div><dt className="text-muted-foreground">Status</dt><dd className="capitalize">{school.status}</dd></div>
              <div><dt className="text-muted-foreground">Region</dt><dd>{school.region}</dd></div>
              <div><dt className="text-muted-foreground">District</dt><dd>{school.district}</dd></div>
              <div><dt className="text-muted-foreground">Ward</dt><dd>{school.ward || <span className="text-red-500">— missing</span>}</dd></div>
              <div><dt className="text-muted-foreground">Contact</dt><dd>{school.phone || <span className="text-red-500">— missing</span>}</dd></div>
              <div className="col-span-2"><dt className="text-muted-foreground">Address</dt><dd>{school.address || <span className="text-red-500">— missing</span>}</dd></div>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
