import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/tsid/site-header";
import { SiteFooter } from "@/components/tsid/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, AlertCircle, BadgeCheck, AlertTriangle, Phone, MapPin, ShieldAlert } from "lucide-react";

const sp = z.object({ id: z.string().optional() });

export const Route = createFileRoute("/search")({
  validateSearch: sp,
  head: () => ({ meta: [
    { title: "Verify a student or school — TSID" },
    { name: "description", content: "Verify any Tanzania Student ID or school registration number instantly." },
  ]}),
  component: SearchPage,
});

type StudentResult = {
  tsid: string; fullname: string; photo: string | null; dob: string | null;
  level: string | null; school_name: string | null; region: string | null;
  district: string | null; status: string | null; missing: boolean;
};
type SchoolResult = {
  school_code: string; school_name: string; type: string | null;
  region: string | null; district: string | null; status: string | null;
};

function ageFromDob(dob?: string | null): string {
  if (!dob) return "—";
  const d = new Date(dob); if (isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const yrs = Math.floor(diff / (365.25 * 24 * 3600 * 1000));
  return yrs > 0 && yrs < 120 ? `${yrs} yrs` : "—";
}

function SearchPage() {
  const { id } = Route.useSearch();
  const [mode, setMode] = useState<"student" | "school">("student");
  const [q, setQ] = useState(id ?? "");
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState<StudentResult | null>(null);
  const [school, setSchool] = useState<SchoolResult | null>(null);
  const [searched, setSearched] = useState(false);

  // gov gating + missing contacts
  const [isGov, setIsGov] = useState(false);
  const [contacts, setContacts] = useState<any | null>(null);
  const [loadingContacts, setLoadingContacts] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: row } = await supabase.from("admin_users").select("role").eq("auth_uid", data.user.id).maybeSingle();
      setIsGov(["gov", "admin", "gov_region", "gov_district"].includes(row?.role ?? ""));
    });
  }, []);

  async function run(value: string) {
    if (!value.trim()) return;
    setLoading(true); setSearched(true); setStudent(null); setSchool(null); setContacts(null);
    if (mode === "student") {
      const { data } = await supabase.rpc("verify_student", { p_tsid: value.trim() });
      setStudent((data?.[0] as StudentResult) ?? null);
    } else {
      const { data } = await supabase.rpc("verify_school", { p_code: value.trim() });
      setSchool((data?.[0] as SchoolResult) ?? null);
    }
    setLoading(false);
  }

  async function revealContacts(tsid: string) {
    setLoadingContacts(true);
    const { data, error } = await supabase.rpc("missing_contacts", { p_tsid: tsid });
    setLoadingContacts(false);
    if (error || !data?.length) { setContacts({ none: true }); return; }
    setContacts(data[0]);
  }

  useEffect(() => { if (id) { setMode("student"); run(id); } /* eslint-disable-next-line */ }, [id]);

  return (
    <div className="min-h-screen flex flex-col" id="main-content">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-3xl w-full px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>Verify a record</h1>
        <p className="mt-2 text-muted-foreground">Look up a student (TSID) or a school registration number.</p>

        {/* mode toggle */}
        <div className="mt-4 flex gap-2">
          {(["student", "school"] as const).map((m) => (
            <button key={m} onClick={() => { setMode(m); setSearched(false); setStudent(null); setSchool(null); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold capitalize ${mode === m ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}>
              {m}
            </button>
          ))}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); run(q); }} className="mt-4 flex gap-2">
          <Input placeholder={mode === "student" ? "TSID-YYYY-XXXXXXX" : "School code"} value={q} onChange={(e) => setQ(e.target.value)} className="font-mono" />
          <Button type="submit" disabled={loading}><SearchIcon className="h-4 w-4 mr-2" /> {loading ? "Searching…" : "Search"}</Button>
        </form>

        {searched && !loading && mode === "student" && (
          <div className="mt-8">
            {student ? (
              <div className="rounded-2xl border bg-card overflow-hidden">
                {student.missing && (
                  <div className="bg-red-600 text-white px-5 py-2.5 flex items-center gap-2 font-semibold text-sm">
                    <AlertTriangle className="h-4 w-4" /> MISSING CHILD — if you have seen this child, contact authorities immediately.
                  </div>
                )}
                <div className="p-6 flex items-start gap-5 flex-wrap">
                  <div className="h-28 w-28 rounded-2xl overflow-hidden bg-muted border shrink-0 flex items-center justify-center">
                    {student.photo ? <img src={student.photo} alt="" className="h-full w-full object-cover" /> : <span className="text-4xl">👤</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm"><BadgeCheck className="h-4 w-4" /> Verified record</div>
                    <div className="text-2xl font-bold mt-1">{student.fullname}</div>
                    <div className="font-mono text-sm text-muted-foreground">{student.tsid}</div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-3 text-sm">
                      <Field label="Age" value={ageFromDob(student.dob)} />
                      <Field label="Grade / Class" value={student.level ?? "—"} />
                      <Field label="School" value={student.school_name ?? "—"} />
                      <Field label="Status" value={student.status ?? "—"} />
                      <Field label="Location" value={[student.district, student.region].filter(Boolean).join(", ") || "—"} />
                    </div>
                  </div>
                </div>

                {/* Missing-child emergency contacts — gov only */}
                {student.missing && isGov && (
                  <div className="px-6 pb-6">
                    {!contacts ? (
                      <Button variant="destructive" onClick={() => revealContacts(student.tsid)} disabled={loadingContacts}>
                        <ShieldAlert className="h-4 w-4 mr-2" /> {loadingContacts ? "Loading…" : "Reveal Emergency Contacts"}
                      </Button>
                    ) : contacts.none ? (
                      <div className="text-sm text-muted-foreground">No contacts available.</div>
                    ) : (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-1.5 text-sm">
                        <div className="font-semibold text-red-800 flex items-center gap-1.5"><Phone className="h-4 w-4" /> Emergency Contacts</div>
                        {contacts.parent_name && <div><strong>Parent/Guardian:</strong> {contacts.parent_name} {contacts.parent_phone ? `· ${contacts.parent_phone}` : ""}</div>}
                        {contacts.emergency_contact_name && <div><strong>Emergency:</strong> {contacts.emergency_contact_name} {contacts.emergency_contact_phone ? `· ${contacts.emergency_contact_phone}` : ""}</div>}
                        {contacts.home_address && <div className="flex items-start gap-1"><MapPin className="h-3.5 w-3.5 mt-0.5" /> {contacts.home_address}</div>}
                        {contacts.missing_since && <div className="text-xs text-red-700">Reported missing: {new Date(contacts.missing_since).toLocaleString()}</div>}
                        {contacts.missing_note && <div className="text-xs">{contacts.missing_note}</div>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : <NotFound label="This TSID number is not registered." />}
          </div>
        )}

        {searched && !loading && mode === "school" && (
          <div className="mt-8">
            {school ? (
              <div className="rounded-2xl border bg-card p-6">
                <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm"><BadgeCheck className="h-4 w-4" /> Verified school</div>
                <div className="text-2xl font-bold mt-1">{school.school_name}</div>
                <div className="font-mono text-sm text-muted-foreground">{school.school_code}</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-3 text-sm">
                  <Field label="Type" value={school.type ?? "—"} />
                  <Field label="Status" value={school.status ?? "—"} />
                  <Field label="Location" value={[school.district, school.region].filter(Boolean).join(", ") || "—"} />
                </div>
              </div>
            ) : <NotFound label="This school code is not registered." />}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return <div><span className="text-muted-foreground">{label}: </span><span className="font-medium">{value}</span></div>;
}
function NotFound({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 text-destructive p-6 flex items-start gap-3">
      <AlertCircle className="h-5 w-5 mt-0.5" />
      <div><div className="font-semibold">No record found</div><div className="text-sm opacity-90">{label}</div></div>
    </div>
  );
}
