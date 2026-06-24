import { Link } from "@tanstack/react-router";
import { ASSETS } from "@/lib/tsid";
import { useTheme } from "@/lib/theme";
import { Mail, MapPin, Phone, ExternalLink, MessageSquare } from "lucide-react";

const GOV_LINKS = [
  { label: "PO-RALG (TAMISEMI)",         href: "https://tamisemi.go.tz" },
  { label: "eGA (Serikali Mtandao)",      href: "https://ega.go.tz" },
  { label: "NIDA",                        href: "https://nida.go.tz" },
  { label: "Wizara ya Elimu (MoEST)",    href: "https://moe.go.tz" },
  { label: "Ofisi ya Rais (OR-TAMISEMI)",href: "https://www.tamisemi.go.tz" },
];

export function SiteFooter() {
  const { t, theme } = useTheme();
  const isDark = theme === "dark";

  // Dark navy background — matches reference
  const bg     = "#111827";
  const card   = "#1a2537";
  const text   = "#f1f5f9";
  const sub    = "#94a3b8";
  const green  = "#1B8F3A";
  const border = "rgba(255,255,255,.07)";

  const SERVICES = [
    t("feat_school_title") || "Student ID Issuance",
    "Verification Portal",
    "School Registration",
    "Government Oversight",
    "ID Card Printing",
    "QR Code Verification",
    "Audit & Logs",
  ];

  const CONTACT = [
    { icon: <MapPin  style={{ width: 14, height: 14, flexShrink: 0, color: green }} />, text: "Wizara ya Elimu, Sayansi na Teknolojia, P.O. Box 10, Dodoma" },
    { icon: <Mail    style={{ width: 14, height: 14, flexShrink: 0, color: green }} />, text: "support@tsid.go.tz" },
    { icon: <Phone   style={{ width: 14, height: 14, flexShrink: 0, color: green }} />, text: "+255 22 211 0399" },
  ];

  return (
    <footer role="contentinfo" aria-label="Site footer" style={{ background: bg, color: text, fontFamily: "var(--font-sans)" }}>
      {/* TZ flag stripe */}
      <div className="tz-flag-stripe" />

      {/* Main grid — 4 columns matching reference */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 24px 40px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 40 }}>

        {/* Col 1: Brand */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <img src={ASSETS.logo} alt="TSID" style={{ width: 52, height: 52, objectFit: "contain", filter: "drop-shadow(0 2px 8px rgba(0,0,0,.4))" }} />
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 20, color: "#fff", letterSpacing: -0.3, lineHeight: 1 }}>TSID</div>
              <div style={{ fontSize: 9, fontWeight: 800, color: green, letterSpacing: 1, marginTop: 3, textTransform: "uppercase" }}>Tanzania Student ID</div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: sub, lineHeight: 1.75, marginBottom: 20, maxWidth: 240 }}>
            {t("footer_desc")}
          </p>
          {/* Compliance badges */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["PO-RALG / TAMISEMI", "EGA COMPLIANT"].map((badge) => (
              <span key={badge} style={{ fontSize: 10, fontWeight: 800, color: sub, border: `1px solid ${border}`, borderRadius: 6, padding: "4px 10px", letterSpacing: 0.5 }}>{badge}</span>
            ))}
          </div>
        </div>

        {/* Col 2: Our Services */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <div style={{ width: 20, height: 2, background: green, borderRadius: 2 }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: 1 }}>
              {t("footer_platform") || "Our Services"}
            </span>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {SERVICES.map((s) => (
              <li key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: green, flexShrink: 0 }} />
                <Link to="/auth" style={{ fontSize: 13, color: sub, textDecoration: "none", transition: "color .15s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = sub; }}>
                  {s}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3: Government of Tanzania */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <div style={{ width: 20, height: 2, background: green, borderRadius: 2 }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: 1 }}>
              Government of Tanzania
            </span>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
            {GOV_LINKS.map(({ label, href }) => (
              <li key={label}>
                <a href={href} target="_blank" rel="noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: sub, textDecoration: "none", transition: "color .15s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = sub; }}>
                  <ExternalLink style={{ width: 12, height: 12, flexShrink: 0 }} />
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 4: Contact Us */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <div style={{ width: 20, height: 2, background: green, borderRadius: 2 }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: 1 }}>
              {t("footer_contact") || "Contact Us"}
            </span>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
            {CONTACT.map(({ icon, text: txt }) => (
              <li key={txt} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ marginTop: 1 }}>{icon}</span>
                <span style={{ fontSize: 13, color: sub, lineHeight: 1.55 }}>{txt}</span>
              </li>
            ))}
          </ul>
          {/* Compliance note */}
          <div style={{ marginTop: 16, background: card, borderRadius: 10, padding: "10px 14px", display: "flex", gap: 8 }}>
            <div style={{ width: 16, height: 16, borderRadius: "50%", border: `1.5px solid ${green}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
              <div style={{ width: 6, height: 6, background: green, borderRadius: "50%" }} />
            </div>
            <p style={{ fontSize: 11.5, color: sub, lineHeight: 1.55, margin: 0 }}>
              This system complies with the eGovernment Act, 2019 for data protection.
            </p>
          </div>

          {/* Send Feedback button */}
          <a href="mailto:support@tsid.go.tz"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 16, padding: "10px 20px", borderRadius: 10, background: green, color: "#fff", fontWeight: 700, fontSize: 13.5, textDecoration: "none" }}>
            <MessageSquare style={{ width: 15, height: 15 }} />
            {t("send_feedback") || "Send Feedback"}
          </a>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: `1px solid ${border}` }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "18px 24px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={ASSETS.coat} alt="" style={{ width: 24, height: 24, opacity: 0.7 }} />
            <span style={{ fontSize: 12, color: sub }}>© {new Date().getFullYear()} {t("footer_copy")}</span>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            {[t("privacy"), t("terms"), t("accessibility")].map((label) => (
              <a key={label} href="#" style={{ fontSize: 12, color: sub, textDecoration: "none" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = sub; }}>
                {label}
              </a>
            ))}
          </div>
          <span style={{ fontSize: 11.5, color: "rgba(148,163,184,.35)", fontFamily: "ui-monospace" }}>TSID v2.0 · Phase 1</span>
        </div>
      </div>
    </footer>
  );
}
