import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { StudentProfileDrawer } from "@/components/tsid/student-profile-drawer";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { IdCard } from "@/components/tsid/id-card";
import { requiredYears, developmentProgress, EXAM_INDEX_FIELDS, type DevRecord } from "@/lib/development";

export const Route = createFileRoute("/_authenticated/student/")({ component: Page });

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-baseline py-2 border-b border-border/50 text-sm gap-3">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={`font-medium text-right ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}

function Page() {
  const me = useCurrentUser();
  const [editOpen, setEditOpen] = useState(false);

  const { data: student } = useQuery({
    enabled: !!me.tsid,
    queryKey: ["my-student", me.tsid],
    queryFn: async () => (await supabase.from("students").select("*").eq("tsid", me.tsid!).maybeSingle()).data,
  });

  const { data: devRecords = [] } = useQuery({
    enabled: !!me.tsid,
    queryKey: ["dev-records", me.tsid],
    queryFn: async () => (await supabase.from("student_development").select("*").eq("tsid", me.tsid!)).data ?? [],
  });

  if (me.loading) return null;

  if (!me.tsid || !student) {
    return (
      <div className="max-w-xl rounded-2xl border bg-card p-8 space-y-3">
        <h2 className="text-xl font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>No student record linked</h2>
        <p className="text-sm text-muted-foreground">Your account isn't linked to a TSID yet. Contact your school.</p>
      </div>
    );
  }

  const firstName = student.fullname.split(" ")[0];
  const devYears = requiredYears({
    startYear: student.start_year, startLevel: student.start_level,
    currentLevel: student.level, schoolType: student.school_type, enrollmentDate: student.enrollment_date,
  });
  const devProgress = developmentProgress(devRecords as DevRecord[], devYears);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-primary text-primary-foreground p-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 min-w-0">
          <div className="h-20 w-20 rounded-2xl overflow-hidden bg-white/15 border-2 border-white/30 shrink-0 flex items-center justify-center">
            {student.photo
              ? <img src={student.photo} alt="" className="h-full w-full object-cover" />
              : <span className="text-3xl">👤</span>}
          </div>
          <div className="min-w-0">
            <div className="text-2xl font-bold truncate" style={{ fontFamily: "var(--font-display)" }}>Karibu, {firstName}! 👋</div>
            <div className="text-sm opacity-90 truncate">{student.fullname}</div>
            <div className="text-sm opacity-80 mt-0.5 font-mono">{student.tsid}</div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 max-w-[180px] h-2 rounded-full bg-white/20 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${devProgress.percent}%`, background: devProgress.complete ? "#4ade80" : "#fbbf24" }} />
              </div>
              <span className="text-xs font-bold">{devProgress.percent}% development</span>
            </div>
            {student.talent_primary && (
              <div className="text-xs opacity-90 mt-1.5">⭐ Talent: <strong>{student.talent_primary}</strong>{student.talent_secondary ? ` · ${student.talent_secondary}` : ""}</div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setEditOpen(true)}>✏️ Edit Profile</Button>
          <Button asChild variant="secondary">
            <Link to="/student/id">🪪 View My ID Card →</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Status", value: student.status, color: student.status === "active" ? "text-emerald-700" : "text-red-600" },
          { label: "Level", value: student.level ?? "—", color: "" },
          { label: "School", value: student.school_name ?? "—", color: "" },
          { label: "Region", value: student.region ?? "—", color: "" },
        ].map((t) => (
          <div key={t.label} className="rounded-2xl border bg-card p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{t.label}</div>
            <div className={`mt-1 font-semibold capitalize truncate ${t.color}`}>{t.value}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-primary text-primary-foreground font-semibold text-sm">📋 Student Information</div>
          <div className="px-4 py-2">
            <InfoRow label="TSID" value={student.tsid} mono />
            <InfoRow label="Full Name" value={student.fullname} />
            <InfoRow label="Date of Birth" value={student.dob ?? "—"} />
            <InfoRow label="Gender" value={student.gender ?? "—"} />
            <InfoRow label="Nationality" value={student.nationality ?? "Tanzanian"} />
            <InfoRow label="Blood Group" value={student.blood_group ?? "—"} />
            <InfoRow label="Level" value={student.level ?? "—"} />
            <InfoRow label="Enrollment" value={student.enrollment_date ?? "—"} />
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/30 font-semibold text-sm">🏫 School</div>
            <div className="px-4 py-2">
              <InfoRow label="Name" value={student.school_name ?? "—"} />
              <InfoRow label="Code" value={student.school_code} mono />
              <InfoRow label="Region" value={student.region} />
              <InfoRow label="District" value={student.district} />
              <InfoRow label="Contact" value={student.school_contact ?? "—"} />
            </div>
          </div>
          <div className="rounded-2xl border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/30 font-semibold text-sm">👨‍👩‍👧 Parent / Guardian</div>
            <div className="px-4 py-2">
              <InfoRow label="Name" value={student.parent_name ?? "—"} />
              <InfoRow label="Relationship" value={student.relationship ?? "—"} />
              <InfoRow label="Phone" value={student.parent_phone ?? "—"} />
            </div>
          </div>
          <div className="rounded-2xl border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/30 font-semibold text-sm">🩺 Health & Personal Details</div>
            <div className="px-4 py-2">
              <InfoRow label="Ethnicity (Kabila)" value={student.ethnicity ?? "—"} />
              <InfoRow label="Religion (Dini)" value={student.religion ?? "—"} />
              <InfoRow label="Disability (Ulemavu)" value={student.disability ?? "None"} />
              <InfoRow label="Health Condition" value={student.health_condition ?? "—"} />
              <InfoRow label="Allergies (Mzio)" value={student.allergies ?? "—"} />
              <InfoRow label="Home Address" value={student.home_address ?? "—"} />
              <InfoRow label="Emergency Contact" value={student.emergency_contact_name ?? "—"} />
              <InfoRow label="Emergency Phone" value={student.emergency_contact_phone ?? "—"} />
            </div>
          </div>

          {EXAM_INDEX_FIELDS.some((f) => (student as any)[f.key]) && (
            <div className="rounded-2xl border bg-card overflow-hidden md:col-span-2">
              <div className="px-4 py-3 border-b bg-muted/30 font-semibold text-sm">🎓 Exam / Registration Index Numbers</div>
              <div className="px-4 py-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                {EXAM_INDEX_FIELDS.filter((f) => (student as any)[f.key]).map((f) => (
                  <InfoRow key={f.key} label={f.label} value={(student as any)[f.key]} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b font-semibold text-sm flex items-center justify-between">
          <span>🪪 ID Card Preview</span>
          <Button asChild size="sm" variant="outline"><Link to="/student/id">Full size & print →</Link></Button>
        </div>
        <div className="p-6 flex justify-center">
          <IdCard data={{
            tsid: student.tsid, fullname: student.fullname,
            school_name: student.school_name, school_code: student.school_code,
            region: student.region, district: student.district,
            dob: student.dob, gender: student.gender,
            nationality: student.nationality, photo_url: student.photo, status: student.status,
          }} showBack={false} downloadable={false} />
        </div>
      </div>

      {editOpen && me.tsid && (
        <StudentProfileDrawer
          tsid={me.tsid}
          viewerRole="student"
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}