import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState } from "react";
import { Plus, BadgeCheck, BadgeX, Copy } from "lucide-react";
import { sha256Hex } from "@/lib/tsid";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/gov/schools")({ component: Page });

type SchoolType = Database["public"]["Enums"]["school_type"];
const SCHOOL_TYPES: SchoolType[] = ["Primary School", "Secondary School", "University / College", "Vocational Training", "Special Needs School"];
const TZ_REGIONS = ["Arusha","Dar es Salaam","Dodoma","Geita","Iringa","Kagera","Katavi","Kigoma","Kilimanjaro","Lindi","Manyara","Mara","Mbeya","Morogoro","Mtwara","Mwanza","Njombe","Pemba North","Pemba South","Pwani","Rukwa","Ruvuma","Shinyanga","Simiyu","Singida","Songwe","Tabora","Tanga","Unguja North","Unguja South","Zanzibar"];

const REGION_PREFIX: Record<string, string> = { "Dar es Salaam":"DS", Arusha:"AR", Mbeya:"MB", Dodoma:"DO", Mwanza:"MW", Tanga:"TG", Morogoro:"MO", Kagera:"KG", Kigoma:"KI", Lindi:"LD", Mara:"MR", Mtwara:"MT", Pwani:"PW", Rukwa:"RK", Shinyanga:"SH", Singida:"SG", Tabora:"TB", Geita:"GT", Katavi:"KV", Njombe:"NJ", Simiyu:"SM", Songwe:"SW" };
function genCode(region: string) {
  const prefix = REGION_PREFIX[region] ?? region.slice(0,2).toUpperCase();
  return `${prefix}${Math.floor(1000 + Math.random()*9000)}`;
}
function genPassword() {
  return "sc" + Math.random().toString(36).slice(2,8).toUpperCase() + "!";
}

function Page() {
  const qc = useQueryClient();
  const me = useCurrentUser();
  const [open, setOpen] = useState(false);

  const { data: schools = [] } = useQuery({
    queryKey: ["gov-schools"],
    queryFn: async () => (await supabase.from("schools").select("code,name,type,region,district,ward,username,status").order("name")).data ?? [],
  });

  async function toggleStatus(code: string, currentStatus: string) {
    const next = currentStatus === "active" ? "suspended" : "active";
    const { error } = await supabase.from("schools").update({ status: next }).eq("code", code);
    if (error) toast.error(error.message);
    else { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["gov-schools"] }); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>Schools</h1>
          <p className="text-sm text-muted-foreground">Register institutions and issue their admin credentials.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary"><Plus className="h-4 w-4 mr-2" /> Register school</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Register New School</DialogTitle></DialogHeader>
            <RegisterSchoolForm
              actorName={me.fullName ?? "Gov Admin"}
              onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["gov-schools"] }); }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total schools", value: schools.length },
          { label: "Active", value: schools.filter((s) => s.status === "active").length },
          { label: "Suspended", value: schools.filter((s) => s.status !== "active").length },
        ].map((t) => (
          <div key={t.label} className="rounded-2xl border bg-card p-4">
            <div className="text-2xl font-bold">{t.value}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{t.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30 font-semibold text-sm">Registered schools ({schools.length})</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="px-4 py-3">Code</th><th className="px-4 py-3">School</th><th className="px-4 py-3">Region</th><th className="px-4 py-3">Username</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th></tr>
            </thead>
            <tbody>
              {schools.map((s) => (
                <tr key={s.code} className="border-t hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono text-xs text-primary font-bold">{s.code}</td>
                  <td className="px-4 py-3"><div className="font-semibold">{s.name}</div><div className="text-xs text-muted-foreground">{s.type}</div></td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{s.region}{s.district ? ` · ${s.district}` : ""}</td>
                  <td className="px-4 py-3 font-mono text-xs">{s.username}</td>
                  <td className="px-4 py-3">
                    {s.status === "active"
                      ? <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold"><BadgeCheck className="h-3.5 w-3.5" /> Active</span>
                      : <span className="inline-flex items-center gap-1 text-muted-foreground text-xs"><BadgeX className="h-3.5 w-3.5" /> {s.status}</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => toggleStatus(s.code, s.status)}>
                      {s.status === "active" ? "Suspend" : "Activate"}
                    </Button>
                  </td>
                </tr>
              ))}
              {schools.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No schools registered yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RegisterSchoolForm({ actorName, onDone }: { actorName: string; onDone: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<SchoolType>("Secondary School");
  const [region, setRegion] = useState("");
  const [district, setDistrict] = useState("");
  const [ward, setWard] = useState("");
  const [address, setAddress] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState(genPassword());
  const [loading, setLoading] = useState(false);
  const [issued, setIssued] = useState<{ code: string; username: string; password: string } | null>(null);

  function autoFill(r: string) {
    if (r && !code) setCode(genCode(r));
    if (!username) setUsername(name.toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,30) || "school" + Math.random().toString(36).slice(2,6));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !region || !district || !ward || !code || !username || !password) {
      toast.error("Fill all required fields."); return;
    }
    setLoading(true);
    const hash = await sha256Hex(password);
    const { error } = await supabase.from("schools").insert({
      code, name, type, region, district, ward,
      address: address || null,
      contact: contact || null,
      email: email || null,
      username, password: hash, status: "active",
    });
    if (error) { toast.error(error.message); setLoading(false); return; }
    await supabase.from("activity_logs").insert({
      action: "school:create", message: `Registered school ${code} — ${name}`,
      by_name: actorName, by_role: "gov", by_ref: code,
    });
    setLoading(false);
    setIssued({ code, username, password });
    toast.success(`School ${code} registered!`);
  }

  if (issued) {
    return (
      <div className="space-y-4 py-2">
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5">
          <div className="font-bold text-emerald-800 text-sm mb-3">✅ Credentials</div>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">School Code</span><strong className="text-primary">{issued.code}</strong></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Username</span><strong>{issued.username}</strong></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Password</span><strong>{issued.password}</strong></div>
          </div>
          <Button className="mt-4 w-full" onClick={() => {
            navigator.clipboard.writeText(`School Code: ${issued.code}\nUsername: ${issued.username}\nPassword: ${issued.password}`);
            toast.success("Credentials copied!");
          }}><Copy className="h-4 w-4 mr-2" /> Copy</Button>
        </div>
        <Button variant="outline" className="w-full" onClick={onDone}>Done</Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label>Institution Type *</Label>
          <Select value={type} onValueChange={(v) => setType(v as SchoolType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{SCHOOL_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>School Name *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Region *</Label>
          <Select value={region} onValueChange={(v) => { setRegion(v); autoFill(v); }}>
            <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
            <SelectContent>{TZ_REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>District *</Label><Input value={district} onChange={(e) => setDistrict(e.target.value)} required /></div>
        <div className="space-y-1.5"><Label>Ward *</Label><Input value={ward} onChange={(e) => setWard(e.target.value)} required /></div>
        <div className="space-y-1.5"><Label>Address</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Contact Phone</Label><Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="+255 7XX XXX XXX" /></div>
        <div className="space-y-1.5"><Label>Contact Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      </div>
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
        <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">🔑 Admin Credentials</div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5"><Label>School Code *</Label><Input className="font-mono font-bold" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="MW1234" required /></div>
          <div className="space-y-1.5"><Label>Username *</Label><Input value={username} onChange={(e) => setUsername(e.target.value)} required /></div>
          <div className="space-y-1.5"><Label>Password *</Label><Input className="font-mono" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => { setCode(region ? genCode(region) : ""); setPassword(genPassword()); }}>
          ↻ Regenerate
        </Button>
      </div>
      <Button type="submit" className="w-full bg-primary" disabled={loading}>
        {loading ? "Registering…" : "🏫 Register School"}
      </Button>
    </form>
  );
}