import { Link, useRouterState } from "@tanstack/react-router";
import { ASSETS } from "@/lib/tsid";
import { useTheme } from "@/lib/theme";
import { useState } from "react";
import { Menu, X, Moon, Sun, Languages } from "lucide-react";

export function SiteHeader() {
  const { theme, lang, toggleTheme, toggleLang, t } = useTheme();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const NAV = [
    { href: "/",        label: t("home"),     exact: true },
    { href: "/search",  label: t("verify"),   exact: false },
    { href: "#features",label: t("features"), exact: false, hash: true },
    { href: "#roles",   label: t("portals"),  exact: false, hash: true },
  ];

  const isDark = theme === "dark";
  const bg   = isDark ? "#0f172a" : "#ffffff";
  const text = isDark ? "#e2e8f0" : "#003366";
  const sub  = isDark ? "#94a3b8" : "#64748b";
  const border = isDark ? "rgba(255,255,255,.07)" : "#e2e8f0";

  return (
    <header className="sticky top-0 z-50" role="banner" style={{ background: bg, borderBottom: `1px solid ${border}`, boxShadow: "0 1px 12px rgba(0,0,0,.07)" }}>
      {/* TZ flag stripe */}
      <div className="tz-flag-stripe" />

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", height: 68, gap: 16 }}>

        {/* Logo + wordmark */}
        <Link to="/" aria-label="TSID Home" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
          <img src={ASSETS.logo} alt="TSID — Tanzania Student Identification System" style={{ width: 52, height: 52, objectFit: "contain" }} />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 22, color: text, letterSpacing: -0.5, lineHeight: 1 }}>TSID</span>
        </Link>

        {/* Gov branding — desktop only */}
        <div className="hidden lg:flex items-center gap-3 pl-5 ml-2" style={{ borderLeft: `1px solid ${border}` }}>
          <img src={ASSETS.coat} alt="" style={{ width: 34, height: 34, objectFit: "contain" }} />
          <div style={{ lineHeight: 1.25 }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: text, letterSpacing: 0.15 }}>JAMHURI YA MUUNGANO WA TANZANIA</div>
            <div style={{ fontSize: 9.5, color: sub }}>United Republic of Tanzania · Wizara ya Elimu</div>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 ml-auto" aria-label="Main navigation">
          {NAV.map((item) => {
            const active = !item.hash && (item.exact ? pathname === item.href : pathname.startsWith(item.href));
            return item.hash ? (
              <a key={item.href} href={item.href} style={{
                padding: "6px 13px", borderRadius: 8, fontSize: 13.5, fontWeight: 600,
                color: sub, textDecoration: "none", transition: "all .15s",
              }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.color = text; (e.target as HTMLElement).style.background = isDark ? "rgba(255,255,255,.06)" : "#f0f4fa"; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.color = sub; (e.target as HTMLElement).style.background = "transparent"; }}
              >{item.label}</a>
            ) : (
              <Link key={item.href} to={item.href} style={{
                padding: "6px 13px", borderRadius: 8, fontSize: 13.5, fontWeight: active ? 700 : 600,
                color: active ? text : sub, background: active ? (isDark ? "rgba(255,255,255,.08)" : "#eef4fb") : "transparent",
                textDecoration: "none", transition: "all .15s",
              }}>{item.label}</Link>
            );
          })}
        </nav>

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }} className="md:ml-4">

          {/* Language toggle */}
          <button onClick={toggleLang} title="Switch language"
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "6px 10px", borderRadius: 8, border: `1px solid ${border}`,
              background: "transparent", cursor: "pointer",
              fontSize: 12, fontWeight: 700, color: sub,
              transition: "all .15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = isDark ? "rgba(255,255,255,.06)" : "#f0f4fa"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <Languages style={{ width: 14, height: 14 }} />
            <span>{lang === "en" ? "SW" : "EN"}</span>
          </button>

          {/* Dark mode toggle */}
          <button onClick={toggleTheme} title="Toggle theme"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 36, height: 36, borderRadius: 8,
              border: `1px solid ${border}`, background: "transparent",
              cursor: "pointer", color: sub, transition: "all .15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = isDark ? "rgba(255,255,255,.06)" : "#f0f4fa"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            {isDark ? <Sun style={{ width: 16, height: 16 }} /> : <Moon style={{ width: 16, height: 16 }} />}
          </button>

          {/* Sign in — desktop */}
          <Link to="/auth" className="hidden md:inline-flex" style={{
            padding: "7px 16px", borderRadius: 8, fontSize: 13.5, fontWeight: 600,
            border: `1.5px solid ${text}`, color: text, textDecoration: "none",
            transition: "all .15s",
          }}>{t("signin")}</Link>

          {/* Hamburger */}
          <button className="md:hidden" onClick={() => setOpen(!open)}
            style={{ padding: 6, borderRadius: 8, border: `1px solid ${border}`, background: "transparent", cursor: "pointer", color: sub }}>
            {open ? <X style={{ width: 20, height: 20 }} /> : <Menu style={{ width: 20, height: 20 }} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={{ background: bg, borderTop: `1px solid ${border}`, padding: "12px 20px 20px" }}>
          <nav style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 16 }}>
            {NAV.map((item) =>
              item.hash ? (
                <a key={item.href} href={item.href} onClick={() => setOpen(false)}
                  style={{ padding: "11px 14px", borderRadius: 10, fontSize: 15, fontWeight: 600, color: sub, textDecoration: "none", display: "block" }}>
                  {item.label}
                </a>
              ) : (
                <Link key={item.href} to={item.href} onClick={() => setOpen(false)}
                  style={{ padding: "11px 14px", borderRadius: 10, fontSize: 15, fontWeight: 600, color: text, textDecoration: "none", display: "block", background: isDark ? "rgba(255,255,255,.04)" : "#f8fafc" }}>
                  {item.label}
                </Link>
              )
            )}
          </nav>
          <div style={{ display: "flex", gap: 10 }}>
            <Link to="/auth" onClick={() => setOpen(false)} style={{
              flex: 1, textAlign: "center", padding: "11px", borderRadius: 10,
              background: "#003366", color: "#fff", textDecoration: "none",
              fontSize: 14, fontWeight: 700,
            }}>{t("signin")}</Link>
          </div>
          {/* Gov branding mobile */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${border}` }}>
            <img src={ASSETS.coat} alt="" style={{ width: 28, height: 28 }} />
            <div style={{ fontSize: 9.5, color: sub, lineHeight: 1.4 }}>
              <strong style={{ color: text }}>JAMHURI YA MUUNGANO WA TANZANIA</strong><br />
              Wizara ya Elimu, Sayansi na Teknolojia
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
