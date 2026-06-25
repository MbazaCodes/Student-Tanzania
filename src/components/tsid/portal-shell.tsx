import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { ASSETS } from "@/lib/tsid";
import { useTheme } from "@/lib/theme";
import { useCurrentUser } from "@/hooks/use-current-user";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { LogOut, Moon, Sun, Languages, Menu, X, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

export type NavItem = { to: string; label: string; icon?: ReactNode };

// Role → portal identity
const ROLE_META: Record<string, { label: string; sub: string; accent: string; badge: string }> = {
  gov:     { label: "Government Portal",  sub: "WIZARA YA ELIMU",          accent: "#1EB53A", badge: "GOV"     },
  admin:   { label: "Government Portal",  sub: "WIZARA YA ELIMU",          accent: "#1EB53A", badge: "ADMIN"   },
  school:  { label: "School Portal",      sub: "SHULE ADMIN",              accent: "#F5C400", badge: "SCHOOL"  },
  student: { label: "Student Portal",     sub: "MWANAFUNZI / MZAZI",       accent: "#007AFF", badge: "STUDENT" },
};

export function PortalShell({ title, subtitle, items }: {
  title: string; subtitle?: string; items: NavItem[];
}) {
  const navigate    = useNavigate();
  const pathname    = useRouterState({ select: (s) => s.location.pathname });
  const { theme, lang, toggleTheme, toggleLang, t } = useTheme();
  const me          = useCurrentUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isDark  = theme === "dark";
  const role    = me.role ?? "student";
  const meta    = ROLE_META[role] ?? ROLE_META.student;

  // ── Sidebar colours ────────────────────────────────────────────────
  const sidebarBg     = isDark ? "#0a1628" : "#002855";
  const sidebarText   = "#e8f0f8";
  const sidebarSub    = "#93bcd6";
  const sidebarBorder = "rgba(255,255,255,.09)";
  const activeBg      = `${meta.accent}22`;
  const activeText    = "#ffffff";
  const hoverBg       = "rgba(255,255,255,.06)";

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  // Breadcrumb segments
  const segments = pathname.split("/").filter(Boolean);

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
        display: "flex", alignItems: "center", gap: 12,
        padding: "18px 16px 16px", borderBottom: `1px solid ${sidebarBorder}`,
        textDecoration: "none",
      }}>
        <img src={ASSETS.coat} alt="" style={{ width: 40, height: 40, objectFit: "contain", flexShrink: 0 }} />
        <div>
          <div style={{
            fontFamily: "var(--font-display)", fontWeight: 900,
            fontSize: 13.5, color: "#fff", letterSpacing: -0.2, lineHeight: 1.15,
          }}>{title}</div>
          <div style={{
            fontSize: 8, fontWeight: 800, color: meta.accent,
            letterSpacing: 1, marginTop: 3, textTransform: "uppercase",
          }}>{subtitle ?? meta.sub}</div>
        </div>
      </Link>

      {/* User chip */}
      {!me.loading && me.email && (
        <div style={{
          margin: "10px 10px 4px",
          padding: "10px 12px",
          borderRadius: 10,
          background: "rgba(255,255,255,.06)",
          border: `1px solid ${sidebarBorder}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Avatar circle */}
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: meta.accent,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 900, fontSize: 12, color: "#fff", flexShrink: 0,
            }}>
              {(me.fullName ?? me.email).charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 11.5, fontWeight: 700, color: "#fff",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {me.fullName ?? me.email?.split("@")[0]}
              </div>
              <div style={{
                fontSize: 9, fontWeight: 700, color: meta.accent,
                letterSpacing: 0.8, textTransform: "uppercase", marginTop: 1,
              }}>
                {meta.badge}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav aria-label="Portal navigation" style={{
        flex: 1, padding: "10px 10px",
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
                borderLeft: active ? `3px solid ${meta.accent}` : "3px solid transparent",
              }}
              onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = hoverBg; }}
              onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <span style={{ width: 18, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: active ? 1 : 0.7 }}>
                {it.icon}
              </span>
              {it.label}
              {active && <ChevronRight style={{ width: 12, height: 12, marginLeft: "auto", opacity: 0.5 }} />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom controls */}
      <div style={{ padding: "12px 10px", borderTop: `1px solid ${sidebarBorder}`, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={toggleTheme}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", borderRadius: 8, border: `1px solid ${sidebarBorder}`, background: "transparent", cursor: "pointer", color: sidebarSub, fontSize: 11, fontWeight: 600 }}>
            {isDark ? <Sun style={{ width: 13, height: 13 }} /> : <Moon style={{ width: 13, height: 13 }} />}
            {isDark ? "Light" : "Dark"}
          </button>
          <button onClick={toggleLang}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", borderRadius: 8, border: `1px solid ${sidebarBorder}`, background: "transparent", cursor: "pointer", color: sidebarSub, fontSize: 11, fontWeight: 600 }}>
            <Languages style={{ width: 13, height: 13 }} />
            {lang === "en" ? "Kiswahili" : "English"}
          </button>
        </div>
        <button onClick={signOut}
          style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 13px", borderRadius: 10, border: "none", background: "rgba(239,68,68,.1)", cursor: "pointer", color: "#fca5a5", fontSize: 13, fontWeight: 600 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,.2)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,.1)"; }}>
          <LogOut style={{ width: 14, height: 14 }} /> {t("signout")}
        </button>
      </div>
    </aside>
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--background)" }}>
      <style>{`
        .portal-desktop-sidebar { display: flex; }
        .portal-mobile-bar      { display: none; }
        .portal-mobile-drawer   { display: none; }
        @media (max-width: 768px) {
          .portal-desktop-sidebar { display: none !important; }
          .portal-mobile-bar      { display: flex !important; }
          .portal-mobile-drawer   { display: flex !important; }
        }
      `}</style>

      {/* Mobile top bar */}
      <div className="portal-mobile-bar" style={{
        background: sidebarBg, color: sidebarText,
        alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", height: 56, flexShrink: 0, position: "relative",
      }}>
        <div className="tz-flag-stripe" style={{ position: "absolute", top: 0, left: 0, right: 0 }} />
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img src={ASSETS.coat} alt="" style={{ width: 32, height: 32, objectFit: "contain" }} />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 14, color: "#fff" }}>{title}</span>
        </Link>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button onClick={toggleTheme} style={{ padding: 7, borderRadius: 8, border: `1px solid ${sidebarBorder}`, background: "transparent", cursor: "pointer", color: sidebarSub }}>
            {isDark ? <Sun style={{ width: 15, height: 15 }} /> : <Moon style={{ width: 15, height: 15 }} />}
          </button>
          <button onClick={toggleLang} style={{ padding: "5px 9px", borderRadius: 8, border: `1px solid ${sidebarBorder}`, background: "transparent", cursor: "pointer", color: sidebarSub, fontSize: 10, fontWeight: 700 }}>
            {lang === "en" ? "SW" : "EN"}
          </button>
          <button onClick={() => setMobileOpen(!mobileOpen)} style={{ padding: 7, borderRadius: 8, border: `1px solid ${sidebarBorder}`, background: "transparent", cursor: "pointer", color: sidebarSub }}>
            {mobileOpen ? <X style={{ width: 17, height: 17 }} /> : <Menu style={{ width: 17, height: 17 }} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="portal-mobile-drawer" style={{ position: "fixed", inset: 0, zIndex: 50 }}>
          <div style={{ width: 260, height: "100%", overflowY: "auto" }}>{sidebar}</div>
          <div style={{ flex: 1, background: "rgba(0,0,0,.5)" }} onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Desktop layout */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div className="portal-desktop-sidebar" style={{ height: "100vh", position: "sticky", top: 0 }}>{sidebar}</div>

        {/* Main content */}
        <main id="main-content" style={{ flex: 1, minWidth: 0, overflowY: "auto", display: "flex", flexDirection: "column" }}>

          {/* ── Top header bar ─────────────────────────────────────────── */}
          <div style={{
            background: "var(--card)",
            borderBottom: "1px solid var(--border)",
            padding: "0 28px",
            height: 60, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            position: "sticky", top: 0, zIndex: 10,
            boxShadow: "0 1px 4px rgba(0,40,85,.06)",
          }}>

            {/* Left: current page + breadcrumb (NOT the portal title — sidebar shows that) */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Accent bar */}
              <div style={{
                width: 4, height: 32, borderRadius: 4,
                background: meta.accent, flexShrink: 0,
              }} />
              <div>
                <div style={{
                  fontFamily: "var(--font-display)", fontWeight: 800,
                  fontSize: 15, color: "var(--foreground)", lineHeight: 1.1,
                  textTransform: "capitalize",
                }}>
                  {segments.length > 1
                    ? segments[segments.length - 1].replace(/-/g, " ")
                    : t("nav_dashboard")}
                </div>
                {/* Breadcrumb */}
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                  {segments.map((seg, i) => (
                    <span key={seg} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{
                        fontSize: 10, fontWeight: i === segments.length - 1 ? 700 : 500,
                        color: i === segments.length - 1 ? meta.accent : "var(--muted-foreground)",
                        textTransform: "capitalize",
                      }}>
                        {seg.replace(/-/g, " ")}
                      </span>
                      {i < segments.length - 1 && (
                        <ChevronRight style={{ width: 10, height: 10, color: "var(--muted-foreground)", opacity: 0.5 }} />
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: TSID logo only — user identity lives in the sidebar */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <img src={ASSETS.logo} alt="TSID" style={{ width: 34, height: 34, objectFit: "contain" }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "#003366", letterSpacing: 0.3 }}>TSID</div>
                  <div style={{ fontSize: 8, color: "#1EB53A", fontWeight: 700, letterSpacing: 0.5 }}>WIZARA YA ELIMU</div>
                </div>
              </div>
            </div>
          </div>

          {/* Page content */}
          <div style={{ flex: 1, maxWidth: 1140, width: "100%", margin: "0 auto", padding: "28px 28px 60px", boxSizing: "border-box" }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
