import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/tsid/site-header";
import { SiteFooter } from "@/components/tsid/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, AlertCircle, BadgeCheck, AlertTriangle, Phone, MapPin, ShieldAlert, Accessibility } from "lucide-react";

const sp = z.object({ id: z.string().optional() });

export const Route = createFileRoute("/search")({
  validateSearch: sp,
  head: () => ({ meta: [
    { title: "Verify a student or school — TSID" },
    { name: "description", content: "Verify any Tanzania Student ID or school by TSID, name, index, NIDA, birth certificate, or mobile." },
  ]}),
  component: SearchPage,
});

function ageFromDob(dob?: string | null): string {
  if (!dob) return "—";
  const d = new Date(dob); if (isNaN(d.getTime())) return "—";
  const yrs = Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
  return yrs > 0 && yrs < 120 ? `${yrs} yrs` : "—";
}
function hasDisability(d?: string | null) {
  const v = (d ?? "").trim().toLowerCase();
  return v !== "" && v !== "none" && v !== "hakuna";
}

function SearchPage() {
  const { id } = Route.useSearch();
  const [mode, setMode] = useState<"student" | "school">("student");
  const [q, setQ] = useState(id ?? "");
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);

  const [isGov, setIsGov] = useState(false);
  const [contacts, setContacts] = useState<Record<string, any>>({});

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: row } = await supabase.from("admin_users").select("role").eq("auth_uid", data.user.id).maybeSingle();
      setIsGov(["gov", "admin", "gov_region", "gov_district"].includes(row?.role ?? ""));
    });
  }, []);

  async function run(value: string) {
    if (value.trim().length < 2) return;
    setLoading(true); setSearched(true); setStudents([]); setSchools([]); setContacts({});
    if (mode === "student") {
      const { data } = await supabase.rpc("search_student", { p_q: value.trim() });
      setStudents(data ?? []);
    } else {
      const { data } = await supabase.rpc("search_school", { p_q: value.trim() });
      setSchools(data ?? []);
    }
    setLoading(false);
  }

  async function revealContacts(tsid: string) {
    const { data } = await supabase.rpc("missing_contacts", { p_tsid: tsid });
    setContacts((c) => ({ ...c, [tsid]: data?.[0] ?? { none: true } }));
  }

  useEffect(() => { if (id) { setMode("student"); run(id); } /* eslint-disable-next-line */ }, [id]);

  return (
    <div className="min-h-screen flex flex-col" id="main-content">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-3xl w-full px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>Verify a record</h1>
        <p className="mt-2 text-muted-foreground">
          {mode === "student"
            ? "Search a student by TSID, name, exam index, NIDA, birth certificate, or mobile."
            : "Search a school by code, name, mobile, or registration number."}
        </p>

        <div className="mt-4 flex gap-2">
          {(["student", "school"] as const).map((m) => (
            <button key={m} onClick={() => { setMode(m); setSearched(false); setStudents([]); setSchools([]); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold capitalize ${mode === m ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
              {m}
            </button>
          ))}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); run(q); }} className="mt-4 flex gap-2">
          <Input placeholder={mode === "student" ? "TSID / name / index / NIDA / birth cert / mobile" : "School code / name / mobile / reg no."} value={q} onChange={(e) => setQ(e.target.value)} />
          <Button type="submit" disabled={loading}><SearchIcon className="h-4 w-4 mr-2" /> {loading ? "Searching…" : "Search"}</Button>
        </form>

        {searched && !loading && mode === "student" && (
          <div className="mt-8 space-y-4">
            {students.length === 0 && <NotFound label="No student matches that search." />}
            {students.length > 1 && <div className="text-sm text-muted-foreground">{students.length} matches found.</div>}
            {students.map((s) => (
              <div key={s.tsid} className="rounded-2xl border bg-card overflow-hidden">
                {s.missing && (
                  <div className="bg-red-600 text-white px-5 py-2.5 flex items-center gap-2 font-semibold text-sm">
                    <AlertTriangle className="h-4 w-4" /> MISSING CHILD — if you have seen this child, contact authorities immediately.
                  </div>
                )}
                <div className="p-6 flex items-start gap-5 flex-wrap">
                  <div className="h-28 w-28 rounded-2xl overflow-hidden bg-muted border shrink-0 flex items-center justify-center">
                    {s.photo ? <img src={s.photo} alt="" className="h-full w-full object-cover" /> : <span className="text-4xl">👤</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm"><BadgeCheck className="h-4 w-4" /> Verified record</div>
                    <div className="text-2xl font-bold mt-1">{s.fullname}</div>
                    <div className="font-mono text-sm text-muted-foreground">{s.tsid}</div>
                    {hasDisability(s.disability) && (
                      <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        <Accessibility className="h-3 w-3" /> {s.disability}
                      </span>
                    )}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-3 text-sm">
                      <Field label="Age" value={ageFromDob(s.dob)} />
                      <Field label="Grade / Class" value={s.level ?? "—"} />
                      <Field label="School" value={s.school_name ?? "—"} />
                      <Field label="School Type" value={s.school_type ?? "—"} />
                      <Field label="Status" value={s.status ?? "—"} />
                      <Field label="Location" value={[s.district, s.region].filter(Boolean).join(", ") || "—"} />
                    </div>
                  </div>
                </div>
                {s.missing && isGov && (
                  <div className="px-6 pb-6">
                    {!contacts[s.tsid] ? (
                      <Button variant="destructive" onClick={() => revealContacts(s.tsid)}>
                        <ShieldAlert className="h-4 w-4 mr-2" /> Reveal Emergency Contacts
                      </Button>
                    ) : contacts[s.tsid].none ? <div className="text-sm text-muted-foreground">No contacts available.</div> : (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-1.5 text-sm">
                        <div className="font-semibold text-red-800 flex items-center gap-1.5"><Phone className="h-4 w-4" /> Emergency Contacts</div>
                        {contacts[s.tsid].parent_name && <div><strong>Parent/Guardian:</strong> {contacts[s.tsid].parent_name} {contacts[s.tsid].parent_phone ? `· ${contacts[s.tsid].parent_phone}` : ""}</div>}
                        {contacts[s.tsid].emergency_contact_name && <div><strong>Emergency:</strong> {contacts[s.tsid].emergency_contact_name} {contacts[s.tsid].emergency_contact_phone ? `· ${contacts[s.tsid].emergency_contact_phone}` : ""}</div>}
                        {contacts[s.tsid].home_address && <div className="flex items-start gap-1"><MapPin className="h-3.5 w-3.5 mt-0.5" /> {contacts[s.tsid].home_address}</div>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {searched && !loading && mode === "school" && (
          <div className="mt-8 space-y-4">
            {schools.length === 0 && <NotFound label="No school matches that search." />}
            {schools.length > 1 && <div className="text-sm text-muted-foreground">{schools.length} matches found.</div>}
            {schools.map((s) => (
              <div key={s.school_code} className="rounded-2xl border bg-card p-6">
                <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm"><BadgeCheck className="h-4 w-4" /> Verified school</div>
                <div className="text-2xl font-bold mt-1">{s.school_name}</div>
                <div className="font-mono text-sm text-muted-foreground">{s.school_code}</div>
                {s.fee_exempt && (
                  <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    {s.category === "special" ? "Shule Maalum" : s.category === "hardship" ? "Mazingira Magumu" : "Exempt"} · Free services
                  </span>
                )}
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-3 text-sm">
                  <Field label="Type" value={s.type ?? "—"} />
                  <Field label="Status" value={s.status ?? "—"} />
                  <Field label="Reg. Number" value={s.reg_number ?? "—"} />
                  <Field label="Contact" value={s.phone || s.school_contact || "—"} />
                  <Field label="Location" value={[s.district, s.region].filter(Boolean).join(", ") || "—"} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return <div><span className="text-muted-foreground">{label}: </span><span className="font-medium capitalize">{value}</span></div>;
}
function NotFound({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 text-destructive p-6 flex items-start gap-3">
      <AlertCircle className="h-5 w-5 mt-0.5" />
      <div><div className="font-semibold">No record found</div><div className="text-sm opacity-90">{label}</div></div>
    </div>
  );
}
