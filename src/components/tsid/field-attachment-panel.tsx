import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Check, Pencil, Trash2, Briefcase, ChevronDown, ChevronRight, X } from "lucide-react";
import { TZ_REGIONS, TZ_DISTRICTS } from "@/lib/tz-geo";
import {
  ATTACHMENT_TYPES, INDUSTRY_SECTORS, DEV_RATINGS, scoreForRating,
  type FieldAttachment, type KPI,
} from "@/lib/development";

export function FieldAttachmentPanel({ student, canEdit }: { student: any; canEdit: boolean }) {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const { data: items = [] } = useQuery({
    enabled: !!student?.tsid,
    queryKey: ["field-attachments", student?.tsid],
    queryFn: async () => (await supabase.from("field_attachments").select("*").eq("tsid", student.tsid).order("year", { ascending: false })).data ?? [],
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-primary">
        <Briefcase className="h-4 w-4" /> Field Study / Internship / Work Experience
      </div>

      {canEdit && !adding && !editId && (
        <Button size="sm" variant="outline" className="w-full" onClick={() => setAdding(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Field / Internship Record
        </Button>
      )}

      {canEdit && (adding || editId) && (
        <FieldForm
          student={student}
          existing={editId ? (items as any[]).find((r) => r.id === editId) : undefined}
          onDone={() => { setAdding(false); setEditId(null); qc.invalidateQueries({ queryKey: ["field-attachments", student.tsid] }); }}
          onCancel={() => { setAdding(false); setEditId(null); }}
        />
      )}

      <div className="space-y-2">
        {items.length === 0 && <div className="text-xs text-muted-foreground text-center py-3">No field/internship records yet.</div>}
        {items.map((r: any) => (
          <AttachmentCard key={r.id} rec={r} canEdit={canEdit}
            onEdit={() => setEditId(r.id)}
            onDelete={async () => {
              if (!confirm("Delete this field record?")) return;
              const { error } = await supabase.from("field_attachments").delete().eq("id", r.id);
              if (error) { toast.error(error.message); return; }
              toast.success("Deleted");
              qc.invalidateQueries({ queryKey: ["field-attachments", student.tsid] });
            }} />
        ))}
      </div>
    </div>
  );
}

function AttachmentCard({ rec, canEdit, onEdit, onDelete }: { rec: any; canEdit: boolean; onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const kpis: KPI[] = Array.isArray(rec.kpis) ? rec.kpis : [];
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-3 py-2 flex items-center justify-between gap-2 cursor-pointer hover:bg-muted/30" onClick={() => setOpen((o) => !o)}>
        <div className="flex items-center gap-2 min-w-0">
          {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate">{rec.job_title || rec.attachment_type} · {rec.institution}</div>
            <div className="text-[11px] text-muted-foreground">{rec.year ?? ""} · {rec.sector === "government" ? "Government" : "Private"}{rec.region ? ` · ${rec.region}` : ""}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {typeof rec.score === "number" && rec.score > 0 && <span className="text-[11px] font-bold" style={{ color: rec.score >= 75 ? "#16a34a" : rec.score >= 50 ? "#d97706" : "#dc2626" }}>{rec.score}%</span>}
          {canEdit && (
            <>
              <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1 hover:bg-muted rounded"><Pencil className="h-3 w-3" /></button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 hover:bg-muted rounded text-red-600"><Trash2 className="h-3 w-3" /></button>
            </>
          )}
        </div>
      </div>
      {open && (
        <div className="px-3 pb-3 pt-1 space-y-1.5 border-t text-sm">
          {rec.designation && <Row label="Designation" value={rec.designation} />}
          {rec.attachment_type && <Row label="Type" value={rec.attachment_type} />}
          {rec.industry && <Row label="Industry" value={rec.industry} />}
          {(rec.start_date || rec.end_date) && <Row label="Period" value={`${rec.start_date ?? "?"} → ${rec.end_date ?? "present"}`} />}
          {(rec.district || rec.region) && <Row label="Location" value={[rec.district, rec.region].filter(Boolean).join(", ")} />}
          {rec.duties && <div><div className="text-[11px] font-semibold text-muted-foreground uppercase">Duties</div><div>{rec.duties}</div></div>}
          {(rec.report_to_name || rec.report_to_email || rec.report_to_phone) && (
            <div><div className="text-[11px] font-semibold text-muted-foreground uppercase">Reports To</div>
              <div>{rec.report_to_name}{rec.report_to_email ? ` · ${rec.report_to_email}` : ""}{rec.report_to_phone ? ` · ${rec.report_to_phone}` : ""}</div>
            </div>
          )}
          {kpis.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase">KPIs</div>
              <div className="space-y-1 mt-1">
                {kpis.map((k, i) => (
                  <div key={i} className="text-xs flex items-center justify-between gap-2 bg-muted/40 rounded px-2 py-1">
                    <span>{k.name}{k.target ? ` (target: ${k.target})` : ""}{k.achieved ? ` — achieved: ${k.achieved}` : ""}</span>
                    {typeof k.score === "number" && <span className="font-bold">{k.score}%</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {rec.remark && <div><div className="text-[11px] font-semibold text-muted-foreground uppercase">Remark</div><div>{rec.rating ? `${rec.rating} · ` : ""}{rec.remark}</div></div>}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-2"><span className="text-muted-foreground text-xs">{label}</span><span className="text-right">{value}</span></div>;
}

function FieldForm({ student, existing, onDone, onCancel }: {
  student: any; existing?: any; onDone: () => void; onCancel: () => void;
}) {
  const me = useCurrentUser();
  const now = new Date().getFullYear();
  const [f, setF] = useState<FieldAttachment>(() => existing ?? {
    tsid: student.tsid, school_code: student.school_code, year: now,
    attachment_type: "Internship", sector: "government", institution: "",
    industry: "", job_title: "", designation: "", region: "", district: "",
    start_date: "", end_date: "", duties: "",
    report_to_name: "", report_to_phone: "", report_to_email: "",
    kpis: [], remark: "", rating: "", score: undefined,
  });
  const [kpis, setKpis] = useState<KPI[]>(Array.isArray(existing?.kpis) ? existing.kpis : []);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof FieldAttachment>(k: K, v: FieldAttachment[K]) { setF((p) => ({ ...p, [k]: v })); }
  const districts = f.region ? (TZ_DISTRICTS[f.region] ?? []) : [];

  function addKpi() { setKpis((k) => [...k, { name: "", target: "", achieved: "", score: undefined }]); }
  function setKpi(i: number, patch: Partial<KPI>) { setKpis((arr) => arr.map((k, j) => j === i ? { ...k, ...patch } : k)); }
  function rmKpi(i: number) { setKpis((arr) => arr.filter((_, j) => j !== i)); }

  async function save() {
    if (!f.institution) { toast.error("Institution is required"); return; }
    setSaving(true);
    const row: any = {
      ...f,
      kpis: kpis.filter((k) => k.name?.trim()),
      score: f.rating ? (f.score ?? scoreForRating(f.rating)) : (f.score ?? null),
      created_by: me.userId, created_by_name: me.fullName ?? "School",
      updated_at: new Date().toISOString(),
    };
    delete row.id;
    let error;
    if (existing?.id) ({ error } = await supabase.from("field_attachments").update(row).eq("id", existing.id));
    else ({ error } = await supabase.from("field_attachments").insert(row));
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    onDone();
  }

  return (
    <div className="rounded-xl border bg-muted/20 p-3 space-y-2.5">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1"><Label className="text-xs">Type</Label>
          <Select value={f.attachment_type ?? ""} onValueChange={(v) => set("attachment_type", v)}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>{ATTACHMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">Year</Label>
          <Input className="h-9" type="number" value={f.year ?? ""} onChange={(e) => set("year", e.target.value ? Number(e.target.value) : null)} />
        </div>
      </div>

      {/* Sector */}
      <div className="space-y-1"><Label className="text-xs">Sector</Label>
        <Select value={f.sector} onValueChange={(v) => set("sector", v as "government" | "private")}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="government">Government</SelectItem>
            <SelectItem value="private">Private</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1"><Label className="text-xs">Institution / Organisation *</Label>
        <Input className="h-9" value={f.institution} onChange={(e) => set("institution", e.target.value)} placeholder="e.g. NHIF / Vodacom Tanzania" />
      </div>
      <div className="space-y-1"><Label className="text-xs">Industry / Sector</Label>
        <Select value={f.industry ?? ""} onValueChange={(v) => set("industry", v)}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Select industry" /></SelectTrigger>
          <SelectContent>{INDUSTRY_SECTORS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1"><Label className="text-xs">Job Title</Label><Input className="h-9" value={f.job_title ?? ""} onChange={(e) => set("job_title", e.target.value)} /></div>
        <div className="space-y-1"><Label className="text-xs">Designation</Label><Input className="h-9" value={f.designation ?? ""} onChange={(e) => set("designation", e.target.value)} /></div>
      </div>

      {/* Location */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1"><Label className="text-xs">Region</Label>
          <Select value={f.region ?? ""} onValueChange={(v) => { set("region", v); set("district", ""); }}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Region" /></SelectTrigger>
            <SelectContent>{TZ_REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">District</Label>
          <Select value={f.district ?? ""} onValueChange={(v) => set("district", v)} disabled={!f.region}>
            <SelectTrigger className="h-9"><SelectValue placeholder={f.region ? "District" : "Region first"} /></SelectTrigger>
            <SelectContent>{districts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1"><Label className="text-xs">Start Date</Label><Input className="h-9" type="date" value={f.start_date ?? ""} onChange={(e) => set("start_date", e.target.value)} /></div>
        <div className="space-y-1"><Label className="text-xs">End Date</Label><Input className="h-9" type="date" value={f.end_date ?? ""} onChange={(e) => set("end_date", e.target.value)} /></div>
      </div>

      <div className="space-y-1"><Label className="text-xs">Responsibilities / Duties</Label>
        <textarea className="w-full rounded-md border px-3 py-2 text-sm min-h-[54px] bg-background" value={f.duties ?? ""} onChange={(e) => set("duties", e.target.value)} />
      </div>

      {/* Report to */}
      <div className="rounded-lg border bg-background p-2 space-y-1.5">
        <Label className="text-xs font-semibold">Reports To (Supervisor)</Label>
        <Input className="h-8 text-xs" value={f.report_to_name ?? ""} onChange={(e) => set("report_to_name", e.target.value)} placeholder="Name" />
        <div className="grid grid-cols-2 gap-2">
          <Input className="h-8 text-xs" value={f.report_to_phone ?? ""} onChange={(e) => set("report_to_phone", e.target.value)} placeholder="Phone" />
          <Input className="h-8 text-xs" value={f.report_to_email ?? ""} onChange={(e) => set("report_to_email", e.target.value)} placeholder="Email" />
        </div>
      </div>

      {/* KPIs */}
      <div className="rounded-lg border bg-background p-2 space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold">KPIs</Label>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={addKpi}><Plus className="h-3 w-3 mr-1" /> Add KPI</Button>
        </div>
        {kpis.map((k, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Input className="h-8 text-xs flex-1" value={k.name} onChange={(e) => setKpi(i, { name: e.target.value })} placeholder="KPI name" />
            <Input className="h-8 text-xs w-20" value={k.target ?? ""} onChange={(e) => setKpi(i, { target: e.target.value })} placeholder="Target" />
            <Input className="h-8 text-xs w-20" value={k.achieved ?? ""} onChange={(e) => setKpi(i, { achieved: e.target.value })} placeholder="Done" />
            <Input className="h-8 text-xs w-14" type="number" value={k.score ?? ""} onChange={(e) => setKpi(i, { score: e.target.value ? Number(e.target.value) : undefined })} placeholder="%" />
            <button onClick={() => rmKpi(i)} className="text-red-500 p-1"><X className="h-3.5 w-3.5" /></button>
          </div>
        ))}
        {kpis.length === 0 && <div className="text-[11px] text-muted-foreground">No KPIs added.</div>}
      </div>

      {/* Overall remark + score */}
      <div className="rounded-lg border bg-background p-2 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Select value={f.rating ?? ""} onValueChange={(v) => { set("rating", v); set("score", scoreForRating(v)); }}>
            <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue placeholder="Overall rating" /></SelectTrigger>
            <SelectContent>{DEV_RATINGS.map((r) => <SelectItem key={r.value} value={r.value}>{r.value} ({r.score}%)</SelectItem>)}</SelectContent>
          </Select>
          <Input className="h-8 w-16 text-xs" type="number" value={f.score ?? ""} onChange={(e) => set("score", e.target.value ? Number(e.target.value) : undefined)} placeholder="%" />
        </div>
        <textarea className="w-full rounded-md border px-3 py-2 text-sm min-h-[44px] bg-background" value={f.remark ?? ""} onChange={(e) => set("remark", e.target.value)} placeholder="Supervisor / school remark" />
      </div>

      <div className="flex gap-2">
        <Button size="sm" className="flex-1 bg-primary" onClick={save} disabled={saving}>
          <Check className="h-3.5 w-3.5 mr-1" /> {saving ? "Saving…" : "Save"}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
