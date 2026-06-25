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

  // ── Sidebar colours — match landing page navy/green identity ──────
  const sidebarBg     = isDark ? "#0a1628" : "#002855";   // deeper navy
  const sidebarText   = "#e8f0f8";
  const sidebarSub    = "#93bcd6";
  const sidebarBorder = "rgba(255,255,255,.09)";
  const activeBg      = "rgba(30,181,58,.18)";            // tz-green tint
  const activeText    = "#ffffff";
  const hoverBg       = "rgba(255,255,255,.06)";

  // ── Main area — clean white/very-light-blue like landing ─────────
  const mainBg        = "var(--background)";   // matches landing page exactly
  const topbarBg      = "var(--card)";
  const topbarBorder  = "var(--border)";

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const sidebar = (
    <aside style={{
      width: 248, background: sidebarBg, color: sidebarText,
      display: "flex", flexDirection: "column",
      flexShrink: 0, height: "100%", overflowY: "auto",
    }}>
      {/* TZ flag stripe */}
      <div className="tz-flag-stripe" />

      {/* Brand */}
      <Link to="/" style={{
        display: "flex", alignItems: "center", gap: 13,
        padding: "20px 18px 18px", borderBottom: `1px solid ${sidebarBorder}`,
        textDecoration: "none",
      }}>
        <img src={ASSETS.coat} alt="" style={{ width: 42, height: 42, objectFit: "contain", flexShrink: 0 }} />
        <div>
          <div style={{
            fontFamily: "var(--font-display)", fontWeight: 900,
            fontSize: 14, color: "#fff", letterSpacing: -0.2, lineHeight: 1.1,
          }}>{title}</div>
          {subtitle && <div style={{
            fontSize: 8.5, fontWeight: 700, color: "#1EB53A",
            letterSpacing: 0.9, marginTop: 3, textTransform: "uppercase",
          }}>{subtitle}</div>}
        </div>
      </Link>

      {/* Nav */}
      <nav aria-label="Portal navigation" style={{
        flex: 1, padding: "14px 10px",
        display: "flex", flexDirection: "column", gap: 2,
      }}>
        {items.map((it) => {
          const active = pathname === it.to || (it.to !== "/" && pathname.startsWith(it.to + "/"));
          return (
            <Link key={it.to} to={it.to} onClick={() => setMobileOpen(false)}
              style={{
                display: "flex", alignItems: "center", gap: 11,
                padding: "10px 13px", borderRadius: 10,
                background: active ? activeBg : "transparent",
                color: active ? activeText : sidebarSub,
                fontWeight: active ? 700 : 500,
                fontSize: 13.5, textDecoration: "none",
                transition: "all .15s",
                borderLeft: active ? "3px solid #1EB53A" : "3px solid transparent",
              }}
              onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = hoverBg; }}
              onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <span style={{ width: 18, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: active ? 1 : 0.7 }}>
                {it.icon}
              </span>
              {it.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom controls */}
      <div style={{ padding: "12px 10px", borderTop: `1px solid ${sidebarBorder}`, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={toggleTheme}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", borderRadius: 8, border: `1px solid ${sidebarBorder}`, background: "transparent", cursor: "pointer", color: sidebarSub, fontSize: 11.5, fontWeight: 600 }}>
            {isDark ? <Sun style={{ width: 13, height: 13 }} /> : <Moon style={{ width: 13, height: 13 }} />}
            {isDark ? "Light" : "Dark"}
          </button>
          <button onClick={toggleLang}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", borderRadius: 8, border: `1px solid ${sidebarBorder}`, background: "transparent", cursor: "pointer", color: sidebarSub, fontSize: 11.5, fontWeight: 600 }}>
            <Languages style={{ width: 13, height: 13 }} />
            {lang === "en" ? "Kiswahili" : "English"}
          </button>
        </div>
        <button onClick={signOut}
          style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 13px", borderRadius: 10, border: "none", background: "rgba(239,68,68,.1)", cursor: "pointer", color: "#fca5a5", fontSize: 13.5, fontWeight: 600, transition: "all .15s" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,.2)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,.1)"; }}>
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
        padding: "0 16px", height: 56, flexShrink: 0, position: "relative",
      }}>
        <div className="tz-flag-stripe" style={{ position: "absolute", top: 0, left: 0, right: 0 }} />
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img src={ASSETS.coat} alt="" style={{ width: 34, height: 34, objectFit: "contain" }} />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 15, color: "#fff" }}>{title}</span>
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

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden" style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
          <div style={{ width: 260, height: "100%", overflowY: "auto" }}>{sidebar}</div>
          <div style={{ flex: 1, background: "rgba(0,0,0,.5)" }} onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Desktop layout */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div className="hidden md:flex" style={{ height: "100vh", position: "sticky", top: 0 }}>{sidebar}</div>

        {/* Main content area */}
        <main id="main-content" style={{ flex: 1, minWidth: 0, overflowY: "auto", display: "flex", flexDirection: "column" }} aria-label="Main content">

          {/* Top bar — matches landing page header feel */}
          <div style={{
            background: topbarBg,
            borderBottom: `1px solid ${topbarBorder}`,
            padding: "0 28px",
            height: 56, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            position: "sticky", top: 0, zIndex: 10,
            boxShadow: "0 1px 3px var(--border)",
          }}>
            {/* breadcrumb path */}
            <div style={{ fontSize: 12, color: isDark ? "#64748b" : "#94a3b8", fontWeight: 600, letterSpacing: 0.3 }}>
              {pathname.split("/").filter(Boolean).map((seg, i, arr) => (
                <span key={seg}>
                  <span style={{ textTransform: "capitalize" }}>{seg.replace(/-/g, " ")}</span>
                  {i < arr.length - 1 && <span style={{ margin: "0 6px", opacity: 0.4 }}>›</span>}
                </span>
              ))}
            </div>

            {/* Right side — TSID logo + gov branding */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src={ASSETS.logo} alt="TSID" style={{ width: 30, height: 30, objectFit: "contain", opacity: 0.85 }} />
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: isDark ? "#94a3b8" : "#003366", letterSpacing: 0.3 }}>TSID</div>
                <div style={{ fontSize: 9, color: "#1EB53A", fontWeight: 700, letterSpacing: 0.5 }}>WIZARA YA ELIMU</div>
              </div>
            </div>
          </div>

          {/* Page content */}
          <div style={{ flex: 1, maxWidth: 1140, width: "100%", margin: "0 auto", padding: "30px 28px 60px", boxSizing: "border-box" }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
