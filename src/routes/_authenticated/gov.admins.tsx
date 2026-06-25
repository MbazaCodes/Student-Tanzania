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
import { Plus, ShieldCheck, MapPin, Building2, Copy, Crown } from "lucide-react";
import { TZ_REGIONS, TZ_DISTRICTS } from "@/lib/tz-geo";

export const Route = createFileRoute("/_authenticated/gov/admins")({ component: Page });

type AdminRole = "gov_region" | "gov_district";

const ROLE_LABELS: Record<string, { label: string; icon: typeof Crown; color: string }> = {
  gov:          { label: "National Admin",  icon: Crown,       color: "#1EB53A" },
  admin:        { label: "National Admin",  icon: Crown,       color: "#1EB53A" },
  gov_region:   { label: "Regional Admin",  icon: MapPin,      color: "#F5C400" },
  gov_district: { label: "District Admin",  icon: Building2,   color: "#007AFF" },
};

function genPassword() {
  return "ad" + Math.random().toString(36).slice(2, 8).toUpperCase() + "!";
}

function Page() {
  const qc = useQueryClient();
  const me = useCurrentUser();
  const [open, setOpen] = useState(false);

  // tier: 0 national, 1 regional. district admins (tier 2) cannot access this page
  const canCreateRegional = me.tier === 0;
  const canCreateDistrict = me.tier === 0 || me.tier === 1;

  const { data: admins = [] } = useQuery({
    queryKey: ["gov-admins"],
    queryFn: async () =>
      (await supabase
        .from("admin_users")
        .select("auth_uid,name,email,role,region,district,status,created_at")
        .in("role", ["gov", "admin", "gov_region", "gov_district"])
        .order("role")
      ).data ?? [],
  });

  if (!me.loading && me.tier === 2) {
    return (
      <div className="rounded-2xl border bg-card p-8 max-w-xl">
        <div className="flex items-center gap-2 text-amber-600 font-semibold">
          <ShieldCheck className="h-5 w-5" /> Access restricted
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          District admins cannot manage other admins. This page is for National and Regional admins only.
        </p>
      </div>
    );
  }

  const national  = admins.filter((a) => a.role === "gov" || a.role === "admin");
  const regional  = admins.filter((a) => a.role === "gov_region");
  const district  = admins.filter((a) => a.role === "gov_district");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>Administrators</h1>
          <p className="text-sm text-muted-foreground">
            {me.tier === 0
              ? "Create and oversee Regional and District administrators nationwide."
              : `Create and oversee District administrators in ${me.region}.`}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary"><Plus className="h-4 w-4 mr-2" /> Create admin</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Administrator</DialogTitle></DialogHeader>
            <CreateAdminForm
              me={me}
              canCreateRegional={canCreateRegional}
              canCreateDistrict={canCreateDistrict}
              onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["gov-admins"] }); }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "National", value: national.length, color: "#1EB53A" },
          { label: "Regional", value: regional.length, color: "#F5C400" },
          { label: "District", value: district.length, color: "#007AFF" },
        ].map((t) => (
          <div key={t.label} className="rounded-2xl border bg-card p-4">
            <div className="text-2xl font-bold" style={{ color: t.color }}>{t.value}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{t.label} admins</div>
          </div>
        ))}
      </div>

      {/* Admin list grouped by tier */}
      {[
        { title: "National Administrators", rows: national },
        { title: "Regional Administrators", rows: regional },
        { title: "District Administrators", rows: district },
      ].map((group) => (
        <div key={group.title} className="rounded-2xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30 font-semibold text-sm">{group.title} ({group.rows.length})</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Scope</th><th className="px-4 py-3">Status</th></tr>
              </thead>
              <tbody>
                {group.rows.map((a) => {
                  const meta = ROLE_LABELS[a.role] ?? ROLE_LABELS.gov_district;
                  return (
                    <tr key={a.auth_uid} className="border-t hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <meta.icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
                          <span className="font-semibold">{a.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{a.email}</td>
                      <td className="px-4 py-3 text-xs">
                        {a.role === "gov" || a.role === "admin"
                          ? "Nationwide"
                          : a.district
                            ? `${a.district}, ${a.region}`
                            : a.region ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs capitalize" style={{ color: a.status === "active" ? "#16a34a" : "#94a3b8" }}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {group.rows.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">None yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

function CreateAdminForm({ me, canCreateRegional, canCreateDistrict, onDone }: {
  me: ReturnType<typeof useCurrentUser>;
  canCreateRegional: boolean;
  canCreateDistrict: boolean;
  onDone: () => void;
}) {
  // National can choose; Regional is locked to district in own region
  const [adminRole, setAdminRole] = useState<AdminRole>(canCreateRegional ? "gov_region" : "gov_district");
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [region, setRegion]   = useState(me.tier === 1 ? (me.region ?? "") : "");
  const [district, setDistrict] = useState("");
  const [password, setPassword] = useState(genPassword());
  const [loading, setLoading] = useState(false);
  const [issued, setIssued]   = useState<{ email: string; password: string } | null>(null);

  const districts = region ? (TZ_DISTRICTS[region] ?? []) : [];
  const needsDistrict = adminRole === "gov_district";
  const regionLocked  = me.tier === 1; // regional admins can't change region

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !region) { toast.error("Fill name, email and region."); return; }
    if (needsDistrict && !district) { toast.error("Select a district."); return; }
    setLoading(true);

    // Create the auth user via signUp (anon-key safe)
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email, password,
      options: { data: { role: adminRole, name } },
    });
    if (signUpErr) { toast.error(signUpErr.message); setLoading(false); return; }
    const newUid = signUpData.user?.id;
    if (!newUid) { toast.error("Could not create auth user."); setLoading(false); return; }

    // Insert admin_users row
    const { error: insErr } = await supabase.from("admin_users").insert({
      auth_uid: newUid,
      name, email,
      role: adminRole,
      region,
      district: needsDistrict ? district : null,
      ministry: "Ministry of Education, Science and Technology",
      status: "active",
      created_by: me.userId,
    });
    if (insErr) { toast.error(insErr.message); setLoading(false); return; }

    // Mirror into user_roles
    await supabase.from("user_roles").upsert({ user_id: newUid, role: adminRole });

    // Log
    await supabase.from("activity_logs").insert({
      action: "admin:create",
      message: `Created ${adminRole === "gov_region" ? "Regional" : "District"} admin ${name} (${email})`,
      by_name: me.fullName ?? "Admin", by_role: me.role ?? "gov", by_ref: me.userId,
    });

    setLoading(false);
    setIssued({ email, password });
    toast.success("Administrator created!");
  }

  if (issued) {
    return (
      <div className="space-y-4 py-2">
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5">
          <div className="font-bold text-emerald-800 text-sm mb-3">✅ Admin credentials</div>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><strong>{issued.email}</strong></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Password</span><strong>{issued.password}</strong></div>
          </div>
          <Button className="mt-4 w-full" onClick={() => {
            navigator.clipboard.writeText(`Email: ${issued.email}\nPassword: ${issued.password}`);
            toast.success("Copied!");
          }}><Copy className="h-4 w-4 mr-2" /> Copy credentials</Button>
        </div>
        <p className="text-xs text-muted-foreground">The new admin should change their password after first login.</p>
        <Button variant="outline" className="w-full" onClick={onDone}>Done</Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 py-2">
      {/* Role selection — national only */}
      {canCreateRegional && (
        <div className="space-y-1.5">
          <Label>Admin Level *</Label>
          <Select value={adminRole} onValueChange={(v) => { setAdminRole(v as AdminRole); setDistrict(""); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="gov_region">Regional Admin — oversees 1 region</SelectItem>
              <SelectItem value="gov_district">District Admin — manages 1 district</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      {!canCreateRegional && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-800">
          You're creating a <strong>District Admin</strong> in <strong>{me.region}</strong>.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label>Full Name *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Asha Mwakyusa" required />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Email *</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@tsid.go.tz" required />
        </div>

        {/* Region */}
        <div className="space-y-1.5">
          <Label>Region *</Label>
          <Select value={region} onValueChange={(v) => { setRegion(v); setDistrict(""); }} disabled={regionLocked}>
            <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
            <SelectContent>
              {TZ_REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* District — only for district admins */}
        {needsDistrict && (
          <div className="space-y-1.5">
            <Label>District *</Label>
            <Select value={district} onValueChange={setDistrict} disabled={!region}>
              <SelectTrigger><SelectValue placeholder={region ? "Select district" : "Region first"} /></SelectTrigger>
              <SelectContent>
                {districts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Credentials */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
        <Label>Temporary Password *</Label>
        <div className="flex gap-2">
          <Input className="font-mono" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="button" variant="outline" size="sm" onClick={() => setPassword(genPassword())}>↻</Button>
        </div>
      </div>

      <Button type="submit" className="w-full bg-primary" disabled={loading}>
        {loading ? "Creating…" : "👤 Create Administrator"}
      </Button>
    </form>
  );
}
