import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, FileText, Trash2, ExternalLink, Plus } from "lucide-react";

export const SCHOOL_DOC_CATEGORIES = [
  { value: "results", label: "Results" },
  { value: "timetable", label: "Timetable" },
  { value: "publication", label: "Publication" },
  { value: "assessment", label: "Assessment Form" },
  { value: "info", label: "Information Center" },
  { value: "other", label: "Other" },
];

export const PARENT_DOC_CATEGORIES = [
  { value: "id", label: "National ID" },
  { value: "birth_cert", label: "Birth Certificate" },
  { value: "other", label: "Other" },
];

type Props = {
  scope: "school" | "student" | "parent";
  schoolCode?: string | null;
  tsid?: string | null;
  ownerRef?: string | null;
  categories: { value: string; label: string }[];
  canUpload: boolean;
  title?: string;
};

export function DocumentsPanel({ scope, schoolCode, tsid, ownerRef, categories, canUpload, title }: Props) {
  const me = useCurrentUser();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const key = ["documents", scope, schoolCode ?? "", tsid ?? "", ownerRef ?? ""];
  const { data: docs = [] } = useQuery({
    queryKey: key,
    queryFn: async () => {
      let q = supabase.from("documents").select("*").eq("scope", scope).order("created_at", { ascending: false });
      if (tsid) q = q.eq("tsid", tsid);
      else if (schoolCode) q = q.eq("school_code", schoolCode);
      else if (ownerRef) q = q.eq("owner_ref", ownerRef);
      return (await q).data ?? [];
    },
  });

  async function remove(id: string) {
    if (!confirm("Delete this document?")) return;
    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: key });
  }

  return (
    <div className="space-y-3">
      {title && <div className="flex items-center gap-1.5 text-sm font-semibold text-primary"><FileText className="h-4 w-4" /> {title}</div>}

      {canUpload && !showForm && (
        <Button size="sm" variant="outline" className="w-full" onClick={() => setShowForm(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Upload Document</Button>
      )}
      {canUpload && showForm && (
        <UploadForm scope={scope} schoolCode={schoolCode} tsid={tsid} ownerRef={ownerRef} categories={categories} me={me}
          onDone={() => { setShowForm(false); qc.invalidateQueries({ queryKey: key }); }} onCancel={() => setShowForm(false)} />
      )}

      <div className="space-y-2">
        {docs.length === 0 && <div className="text-xs text-muted-foreground text-center py-3">No documents yet.</div>}
        {docs.map((d: any) => (
          <div key={d.id} className="rounded-xl border bg-card p-3 flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-medium text-sm truncate">{d.title}</div>
              <div className="text-[11px] text-muted-foreground capitalize">{categories.find((c) => c.value === d.category)?.label ?? d.category}{d.level ? ` · ${d.level}` : ""} · {new Date(d.created_at).toLocaleDateString()}</div>
            </div>
            <a href={d.url} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-muted rounded"><ExternalLink className="h-4 w-4" /></a>
            {canUpload && <button onClick={() => remove(d.id)} className="p-1.5 hover:bg-muted rounded text-red-600"><Trash2 className="h-4 w-4" /></button>}
          </div>
        ))}
      </div>
    </div>
  );
}

function UploadForm({ scope, schoolCode, tsid, ownerRef, categories, me, onDone, onCancel }: any) {
  const [category, setCategory] = useState(categories[0].value);
  const [docTitle, setDocTitle] = useState("");
  const [level, setLevel] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  async function submit() {
    if (!file) { toast.error("Select a file"); return; }
    if (!docTitle.trim()) { toast.error("Enter a title"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${scope}/${schoolCode ?? tsid ?? ownerRef ?? "x"}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("documents").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("documents").getPublicUrl(path);
      const { error } = await supabase.from("documents").insert({
        scope, school_code: schoolCode ?? null, tsid: tsid ?? null, owner_ref: ownerRef ?? null,
        category, title: docTitle.trim(), url: pub.publicUrl, level: level || null,
        uploaded_by: me.fullName ?? me.ref, uploaded_role: me.role,
      });
      if (error) throw error;
      toast.success("Uploaded");
      onDone();
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally { setUploading(false); }
  }

  return (
    <div className="rounded-xl border bg-muted/20 p-3 space-y-2.5">
      <div className="space-y-1"><Label className="text-xs">Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>{categories.map((c: any) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1"><Label className="text-xs">Title</Label><Input className="h-9" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="e.g. Term 1 Results 2026" /></div>
      {scope === "school" && <div className="space-y-1"><Label className="text-xs">Class / Level (optional)</Label><Input className="h-9" value={level} onChange={(e) => setLevel(e.target.value)} placeholder="e.g. Standard 4" /></div>}
      <div className="space-y-1"><Label className="text-xs">File</Label><Input className="h-9" type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
      <div className="flex gap-2">
        <Button size="sm" className="flex-1 bg-primary" onClick={submit} disabled={uploading}><Upload className="h-3.5 w-3.5 mr-1" /> {uploading ? "Uploading…" : "Upload"}</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
