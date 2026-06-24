import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ASSETS } from "@/lib/tsid";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/tsid/site-header";
import { SiteFooter } from "@/components/tsid/site-footer";
import { IdCardFrontOnly, IdCardBackOnly } from "@/components/tsid/id-card";
import {
  ShieldCheck, GraduationCap, Building2, Search, QrCode,
  FileCheck2, UserPlus, CreditCard, CheckCircle2, Globe,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "TSID — Tanzania Student Identification System" }] }),
  component: Index,
});

/* ── Demo card data ──────────────────────────────────────────────── */
const DEMO_DATA = {
  tsid: "TSID-2025-A1234567", fullname: "Juma A. Mwanza",
  school_name: "Shule Ya Msingi Mwanga", school_code: "PS1234",
  region: "Dar es Salaam", district: "Kinondoni",
  dob: "2014-05-15", gender: "Male", nationality: "Tanzanian",
  photo_url: null, status: "active", level: "Primary School",
  blood_group: "O+", enrollment_date: "2020-01-10", issue_date: "2025-05-20",
  parent_name: "Aishatu Juma", parent_nida: "19901234567890123",
  relationship: "Mother", parent_phone: "+255 712 345 678",
};

const CARD_W = 204, CARD_H = 324, SCALE = 0.90;

function HeroCardPreview() {
  const [qr, setQr] = useState("");
  useEffect(() => {
    import("qrcode").then((M) =>
      M.default.toDataURL("https://verify.tsid.go.tz/id/TSID-2025-A1234567", {
        margin: 1, width: 200, color: { dark: "#000", light: "#fff" },
      }).then(setQr).catch(() => {})
    );
  }, []);
  return (
    <div style={{ width: Math.round((CARD_W * 2 + 16) * SCALE), height: Math.round(CARD_H * SCALE), position: "relative", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 0, left: 0, display: "flex", gap: 16, transformOrigin: "top left", transform: `scale(${SCALE})` }}>
        <IdCardFrontOnly data={DEMO_DATA} qr={qr} />
        <IdCardBackOnly data={DEMO_DATA} />
      </div>
    </div>
  );
}

/* ── Shared styles ───────────────────────────────────────────────── */
function S(isDark: boolean) {
  return {
    bg:      isDark ? "#0f172a" : "#ffffff",
    bgAlt:   isDark ? "#0a1628" : "#f0f4fa",
    bgCard:  isDark ? "#1e293b" : "#ffffff",
    text:    isDark ? "#e2e8f0" : "#0f172a",
    primary: isDark ? "#a3c4dd" : "#003366",
    sub:     isDark ? "#94a3b8" : "#64748b",
    border:  isDark ? "rgba(255,255,255,.08)" : "#e2e8f0",
    heroBg:  isDark
      ? "linear-gradient(135deg,#0a1628 0%,#0d1f3c 50%,#0a2015 100%)"
      : "linear-gradient(135deg,#eef4fb 0%,#dceeff 45%,#e8f5ec 100%)",
  };
}

/* ── Section header ──────────────────────────────────────────────── */
function SectionHead({ label, title, sub, isDark }: { label?: string; title: string; sub?: string; isDark: boolean }) {
  const c = S(isDark);
  return (
    <div style={{ textAlign: "center", marginBottom: 56 }}>
      {label && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 14px", borderRadius: 999, background: "rgba(27,143,58,.12)", color: "#1B8F3A", fontSize: 11.5, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>
          <div style={{ width: 20, height: 2, background: "#1B8F3A", borderRadius: 2 }} />
          {label}
          <div style={{ width: 20, height: 2, background: "#1B8F3A", borderRadius: 2 }} />
        </div>
      )}
      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(1.8rem,3vw,2.6rem)", color: c.primary, lineHeight: 1.1, marginBottom: sub ? 14 : 0 }}>{title}</h2>
      {sub && <p style={{ fontSize: 16, color: c.sub, maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>{sub}</p>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
function Index() {
  const { t, theme } = useTheme();
  const isDark = theme === "dark";
  const c = S(isDark);

  /* ── How it works steps ── */
  const STEPS = [
    {
      n: "01", icon: Building2, color: "#003366",
      title: t("how_step1_title") || "Government Registers School",
      body:  t("how_step1_body")  || "The Ministry of Education registers your school in TSID, issues a unique school code and admin login credentials.",
    },
    {
      n: "02", icon: UserPlus, color: "#1B8F3A",
      title: t("how_step2_title") || "School Creates Student Record",
      body:  t("how_step2_body")  || "School administrators log in and create student profiles — uploading photos, parent info and academic details.",
    },
    {
      n: "03", icon: CreditCard, color: "#007AFF",
      title: t("how_step3_title") || "TSID Number Is Issued",
      body:  t("how_step3_body")  || "The system automatically generates a unique TSID number and a printable CR80 ID card with a tamper-evident QR code.",
    },
    {
      n: "04", icon: Globe, color: "#F5C400",
      title: t("how_step4_title") || "Anyone Can Verify Instantly",
      body:  t("how_step4_body")  || "Scan the QR code or enter the TSID number at verify.tsid.go.tz — no login needed, result in seconds.",
    },
  ];

  /* ── Stats ── */
  const STATS = [
    { value: "31", label: t("stat_regions") || "Regions & Councils", color: "#003366" },
    { value: "3", label: t("stat_portals") || "Secure Portals", color: "#1B8F3A" },
    { value: "CR80", label: t("stat_standard") || "ID Card Standard", color: "#007AFF" },
    { value: "100%", label: t("stat_digital") || "Paperless Process", color: "#F5C400" },
  ];

  /* ── Features ── */
  const FEATURES = [
    { icon: GraduationCap, title: t("feat_school_title"), body: t("feat_school_body") },
    { icon: Search,        title: t("feat_verify_title"), body: t("feat_verify_body") },
    { icon: FileCheck2,    title: t("feat_gov_title"),    body: t("feat_gov_body") },
  ];

  /* ── Portals ── */
  const ROLES = [
    { tag: t("role_gov"),    icon: ShieldCheck,   body: t("role_gov_body"),    color: "#003366" },
    { tag: t("role_school"), icon: Building2,      body: t("role_school_body"), color: "#1B8F3A" },
    { tag: t("role_student"),icon: GraduationCap,  body: t("role_student_body"),color: "#007AFF" },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: c.bg }}>
      <SiteHeader />
      <main style={{ flex: 1 }}>

        {/* ══ HERO ════════════════════════════════════════════════════ */}
        <section style={{ background: c.heroBg, minHeight: "calc(100vh - 72px)", display: "flex", alignItems: "center" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", width: "100%", padding: "40px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,480px),1fr))", gap: 48, alignItems: "center" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 999, background: isDark ? "rgba(255,255,255,.07)" : "rgba(0,51,102,.09)", color: isDark ? "#a3c4dd" : "#003366", fontSize: 12, fontWeight: 700, marginBottom: 22 }}>
                <img src={ASSETS.coat} alt="" style={{ height: 16, width: 16 }} />
                {t("official_badge")}
              </div>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(2.2rem,3.6vw,3.5rem)", color: c.primary, lineHeight: 1.06, letterSpacing: -1, marginBottom: 22 }}>
                {t("hero_title")}
              </h1>
              <p style={{ fontSize: 17, color: c.sub, lineHeight: 1.75, marginBottom: 32, maxWidth: 480 }}>
                {t("hero_sub")}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 28 }}>
                <Button asChild size="lg" style={{ background: "#003366", color: "#fff", fontWeight: 700, fontSize: 15, height: 48, paddingLeft: 28, paddingRight: 28 }}>
                  <Link to="/auth">{t("hero_signin")}</Link>
                </Button>
                <Button asChild size="lg" variant="outline" style={{ fontWeight: 600, fontSize: 15, borderColor: isDark ? "#a3c4dd" : "#003366", color: isDark ? "#a3c4dd" : "#003366", height: 48, paddingLeft: 24, paddingRight: 24 }}>
                  <Link to="/search"><Search style={{ width: 16, height: 16, marginRight: 8 }} />{t("hero_verify")}</Link>
                </Button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
                {[
                  { icon: <ShieldCheck style={{ width: 14, height: 14, color: "#1B8F3A" }} />, label: t("rls_secured") },
                  { icon: <QrCode     style={{ width: 14, height: 14, color: "#007AFF" }} />, label: t("tamper_qr") },
                  { icon: <img src={ASSETS.flag} alt="" style={{ height: 12 }} />,             label: t("made_tz") },
                ].map(({ icon, label }) => (
                  <span key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: c.sub, fontWeight: 600 }}>{icon}{label}</span>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, background: isDark ? "rgba(255,255,255,.06)" : "rgba(255,255,255,.70)", backdropFilter: "blur(8px)", borderRadius: 16, padding: "14px 22px", boxShadow: "0 2px 20px rgba(0,51,102,.12)", border: `1px solid ${isDark ? "rgba(255,255,255,.08)" : "rgba(0,51,102,.08)"}` }}>
                <img src={ASSETS.logo} alt="TSID" style={{ width: 80, height: 80, objectFit: "contain", filter: "drop-shadow(0 3px 8px rgba(0,51,102,.20))" }} />
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 32, color: c.primary, letterSpacing: -0.5, lineHeight: 1 }}>TSID</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#1B8F3A", letterSpacing: 1, marginTop: 4, textTransform: "uppercase" }}>Tanzania Student Identification System</div>
                  <div style={{ fontSize: 9.5, fontWeight: 600, color: c.sub, marginTop: 2 }}>Jamhuri ya Muungano wa Tanzania</div>
                </div>
              </div>
              <HeroCardPreview />
            </div>
          </div>
        </section>

        {/* ══ STATS BAR ═══════════════════════════════════════════════ */}
        <section style={{ background: "#003366", borderBottom: "3px solid #1B8F3A" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 0 }}>
            {STATS.map((s, i) => (
              <div key={s.label} style={{ textAlign: "center", padding: "12px 16px", borderRight: i < STATS.length - 1 ? "1px solid rgba(255,255,255,.12)" : "none" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 32, color: s.color === "#F5C400" ? "#F5C400" : "#fff", lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "#a3c4dd", fontWeight: 600, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ══ HOW IT WORKS ════════════════════════════════════════════ */}
        <section id="how" style={{ background: c.bg, padding: "96px 24px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <SectionHead
              label={t("how_label") || "Simple Process"}
              title={t("how_title") || "How TSID Works"}
              sub={t("how_sub") || "Four simple steps from school registration to a verified national student ID — fully digital, fully official."}
              isDark={isDark}
            />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 2, position: "relative" }}>
              {STEPS.map((step, i) => (
                <div key={step.n} style={{ position: "relative" }}>
                  {/* connector line */}
                  {i < STEPS.length - 1 && (
                    <div style={{ position: "absolute", top: 36, right: -1, width: 2, height: 24, background: isDark ? "rgba(255,255,255,.08)" : "#e2e8f0", zIndex: 0, display: "none" }} className="hide-mobile" />
                  )}
                  <div style={{ background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 20, padding: "32px 28px", position: "relative", boxShadow: "0 2px 16px rgba(0,0,0,.04)", margin: "0 4px" }}>
                    {/* Step number */}
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 48, color: isDark ? "rgba(255,255,255,.06)" : "rgba(0,51,102,.06)", lineHeight: 1, position: "absolute", top: 16, right: 20 }}>{step.n}</div>
                    {/* Icon */}
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: step.color, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, boxShadow: `0 4px 14px ${step.color}44` }}>
                      <step.icon style={{ width: 24, height: 24, color: "#fff" }} />
                    </div>
                    {/* Arrow connector */}
                    {i < STEPS.length - 1 && (
                      <div style={{ position: "absolute", top: "50%", right: -16, transform: "translateY(-50%)", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: "50%", background: isDark ? "#1e293b" : "#f0f4fa", border: `1px solid ${c.border}` }}>
                        <ArrowRight style={{ width: 14, height: 14, color: "#1B8F3A" }} />
                      </div>
                    )}
                    <h3 style={{ fontWeight: 800, fontSize: 16, color: c.text, marginBottom: 10, lineHeight: 1.3 }}>{step.title}</h3>
                    <p style={{ fontSize: 13.5, color: c.sub, lineHeight: 1.65 }}>{step.body}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA under steps */}
            <div style={{ textAlign: "center", marginTop: 52 }}>
              <Link to="/auth" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 32px", borderRadius: 12, background: "#003366", color: "#fff", fontWeight: 700, fontSize: 15, textDecoration: "none", boxShadow: "0 4px 16px rgba(0,51,102,.25)" }}>
                {t("hero_signin")} <ArrowRight style={{ width: 16, height: 16 }} />
              </Link>
            </div>
          </div>
        </section>

        {/* ══ FEATURES ════════════════════════════════════════════════ */}
        <section id="features" style={{ background: c.bgAlt, padding: "96px 24px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <SectionHead
              label={t("feat_label") || "What TSID Does"}
              title={t("features_title")}
              isDark={isDark}
            />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 24 }}>
              {FEATURES.map((f, i) => (
                <div key={f.title} style={{ background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 20, padding: "32px 28px", boxShadow: "0 2px 12px rgba(0,0,0,.04)", borderTop: `3px solid ${["#003366","#1B8F3A","#007AFF"][i]}` }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: ["rgba(0,51,102,.10)","rgba(27,143,58,.10)","rgba(0,122,255,.10)"][i], display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                    <f.icon style={{ width: 22, height: 22, color: ["#003366","#1B8F3A","#007AFF"][i] }} />
                  </div>
                  <h3 style={{ fontWeight: 800, fontSize: 17, marginBottom: 10, color: c.text }}>{f.title}</h3>
                  <p style={{ fontSize: 13.5, color: c.sub, lineHeight: 1.65 }}>{f.body}</p>
                  <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 5 }}>
                    <CheckCircle2 style={{ width: 14, height: 14, color: "#1B8F3A", flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "#1B8F3A", fontWeight: 700 }}>{["Ministry of Education","Public access","Real-time KPIs"][i]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ PORTALS ═════════════════════════════════════════════════ */}
        <section id="roles" style={{ background: c.bg, padding: "96px 24px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <SectionHead
              label={t("portals_label") || "Three Portals"}
              title={t("roles_title")}
              sub={t("roles_sub") || "Each stakeholder has a dedicated, role-specific portal with the right tools and permissions."}
              isDark={isDark}
            />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 24 }}>
              {ROLES.map((r) => (
                <div key={r.tag} style={{ background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 20, padding: "32px 28px", boxShadow: "0 2px 12px rgba(0,0,0,.04)", display: "flex", flexDirection: "column" }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: r.color, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, boxShadow: `0 4px 14px ${r.color}44` }}>
                    <r.icon style={{ width: 24, height: 24, color: "#fff" }} />
                  </div>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, color: c.sub, marginBottom: 6, fontWeight: 700 }}>{t("portals")}</div>
                  <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 10, color: c.text }}>{r.tag}</h3>
                  <p style={{ fontSize: 13.5, color: c.sub, lineHeight: 1.65, flex: 1 }}>{r.body}</p>
                  <Link to="/auth" style={{ marginTop: 24, display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 10, background: r.color, color: "#fff", fontWeight: 700, fontSize: 13.5, textDecoration: "none", width: "fit-content" }}>
                    {t("open_portal")} <ArrowRight style={{ width: 14, height: 14 }} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ FINAL CTA BANNER ════════════════════════════════════════ */}
        <section style={{ background: "linear-gradient(135deg,#003366 0%,#004f99 100%)", padding: "72px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          {/* Decorative */}
          <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,.03)" }} />
          <div style={{ position: "absolute", bottom: -60, left: -30, width: 280, height: 280, borderRadius: "50%", background: "rgba(27,143,58,.08)" }} />
          <div style={{ position: "relative", maxWidth: 640, margin: "0 auto" }}>
            <img src={ASSETS.logo} alt="" style={{ width: 68, height: 68, objectFit: "contain", marginBottom: 20, filter: "drop-shadow(0 4px 12px rgba(0,0,0,.3))" }} />
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(1.8rem,3vw,2.6rem)", color: "#fff", lineHeight: 1.1, marginBottom: 16 }}>
              {t("cta_title") || "Tanzania's national student ID system — online now."}
            </h2>
            <p style={{ fontSize: 16, color: "#a3c4dd", lineHeight: 1.7, marginBottom: 36 }}>
              {t("cta_sub") || "Join thousands of schools already using TSID to issue verifiable student identification."}
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/auth" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 32px", borderRadius: 12, background: "#1B8F3A", color: "#fff", fontWeight: 700, fontSize: 15, textDecoration: "none" }}>
                {t("hero_signin")} <ArrowRight style={{ width: 16, height: 16 }} />
              </Link>
              <Link to="/search" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 28px", borderRadius: 12, background: "rgba(255,255,255,.12)", color: "#fff", fontWeight: 600, fontSize: 15, textDecoration: "none", border: "1px solid rgba(255,255,255,.2)" }}>
                <Search style={{ width: 16, height: 16 }} /> {t("hero_verify")}
              </Link>
            </div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
