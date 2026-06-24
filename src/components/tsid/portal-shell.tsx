import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { ASSETS } from "@/lib/tsid";
import { useTheme } from "@/lib/theme";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { LogOut, Moon, Sun, Languages, Menu, X } from "lucide-react";
import type { ReactNode } from "react";

export type NavItem = { to: string; label: string; icon?: ReactNode };

export function PortalShell({ title, items, subtitle }: {
  title: string; subtitle?: string; items: NavItem[];
}) {
  const navigate  = useNavigate();
  const pathname  = useRouterState({ select: (s) => s.location.pathname });
  const { theme, lang, toggleTheme, toggleLang, t } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isDark = theme === "dark";
  const sidebarBg     = isDark ? "#0d1f3c" : "#003366";
  const sidebarText   = "#e2e8f0";
  const sidebarSub    = "#a3c4dd";
  const sidebarBorder = "rgba(255,255,255,.10)";
  const activeBg      = "rgba(255,255,255,.14)";
  const hoverBg       = "rgba(255,255,255,.07)";
  const mainBg        = isDark ? "#0f172a" : "#f0f4fa";

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const sidebar = (
    <aside style={{
      width: 240, background: sidebarBg, color: sidebarText,
      display: "flex", flexDirection: "column",
      flexShrink: 0, height: "100%", overflowY: "auto",
    }}>
      {/* TZ flag stripe */}
      <div className="tz-flag-stripe" />

      {/* Brand */}
      <Link to="/" style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 16px", borderBottom: `1px solid ${sidebarBorder}`, textDecoration: "none" }}>
        <img src={ASSETS.logo} alt="" style={{ width: 44, height: 44, objectFit: "contain" }} />
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 15, color: "#fff", letterSpacing: -0.2 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 9, fontWeight: 700, color: sidebarSub, letterSpacing: 0.8, marginTop: 2, textTransform: "uppercase" }}>{subtitle}</div>}
        </div>
      </Link>

      {/* Nav items */}
      <nav aria-label="Portal navigation" style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 3 }}>
        {items.map((it) => {
          const active = pathname === it.to || (it.to !== "/" && pathname.startsWith(it.to + "/"));
          return (
            <Link key={it.to} to={it.to} onClick={() => setMobileOpen(false)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10,
                background: active ? activeBg : "transparent",
                color: active ? "#fff" : sidebarSub,
                fontWeight: active ? 700 : 500,
                fontSize: 13.5, textDecoration: "none",
                transition: "all .15s",
              }}
              onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = hoverBg; }}
              onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <span style={{ width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: active ? 1 : 0.75 }}>
                {it.icon}
              </span>
              {it.label}
              {active && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: 3, background: "#1EB53A" }} />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom controls */}
      <div style={{ padding: "12px 10px", borderTop: `1px solid ${sidebarBorder}`, display: "flex", flexDirection: "column", gap: 6 }}>
        {/* Theme + Lang row */}
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={toggleTheme} title="Toggle theme"
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", borderRadius: 8, border: `1px solid ${sidebarBorder}`, background: "transparent", cursor: "pointer", color: sidebarSub, fontSize: 12, fontWeight: 600 }}>
            {isDark ? <Sun style={{ width: 14, height: 14 }} /> : <Moon style={{ width: 14, height: 14 }} />}
            {isDark ? "Light" : "Dark"}
          </button>
          <button onClick={toggleLang} title="Switch language"
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", borderRadius: 8, border: `1px solid ${sidebarBorder}`, background: "transparent", cursor: "pointer", color: sidebarSub, fontSize: 12, fontWeight: 600 }}>
            <Languages style={{ width: 14, height: 14 }} />
            {lang === "en" ? "Kiswahili" : "English"}
          </button>
        </div>

        {/* Sign out */}
        <button onClick={signOut}
          style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 12px", borderRadius: 10, border: "none", background: "rgba(239,68,68,.12)", cursor: "pointer", color: "#fca5a5", fontSize: 13.5, fontWeight: 600, transition: "all .15s" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,.22)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,.12)"; }}>
          <LogOut style={{ width: 15, height: 15 }} /> {t("signout")}
        </button>
      </div>
    </aside>
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: mainBg }}>

      {/* Mobile top bar */}
      <div className="md:hidden" style={{
        background: sidebarBg, color: sidebarText,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", height: 56, flexShrink: 0,
      }}>
        <div className="tz-flag-stripe" style={{ position: "absolute", top: 0, left: 0, right: 0 }} />
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img src={ASSETS.logo} alt="" style={{ width: 36, height: 36, objectFit: "contain" }} />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 16, color: "#fff" }}>{title}</span>
        </Link>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={toggleTheme} style={{ padding: 7, borderRadius: 8, border: `1px solid ${sidebarBorder}`, background: "transparent", cursor: "pointer", color: sidebarSub }}>
            {isDark ? <Sun style={{ width: 16, height: 16 }} /> : <Moon style={{ width: 16, height: 16 }} />}
          </button>
          <button onClick={toggleLang} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${sidebarBorder}`, background: "transparent", cursor: "pointer", color: sidebarSub, fontSize: 11, fontWeight: 700 }}>
            {lang === "en" ? "SW" : "EN"}
          </button>
          <button onClick={() => setMobileOpen(!mobileOpen)} style={{ padding: 7, borderRadius: 8, border: `1px solid ${sidebarBorder}`, background: "transparent", cursor: "pointer", color: sidebarSub }}>
            {mobileOpen ? <X style={{ width: 18, height: 18 }} /> : <Menu style={{ width: 18, height: 18 }} />}
          </button>
        </div>
      </div>

      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <div className="md:hidden" style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
          <div style={{ width: 260, height: "100%", overflowY: "auto" }}>{sidebar}</div>
          <div style={{ flex: 1, background: "rgba(0,0,0,.45)" }} onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Desktop layout */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div className="hidden md:flex" style={{ height: "100vh", position: "sticky", top: 0 }}>{sidebar}</div>

        {/* Main content */}
        <main id="main-content" style={{ flex: 1, minWidth: 0, overflowY: "auto" }} aria-label="Main content">
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px 60px" }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
