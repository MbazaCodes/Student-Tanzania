import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ASSETS, roleHome, type Role } from "@/lib/tsid";
import { toast } from "sonner";
import { Eye, EyeOff, ShieldCheck, GraduationCap, Building2 } from "lucide-react";

const searchSchema = z.object({ role: z.enum(["admin","gov","school","student"]).optional() });
export const Route = createFileRoute("/auth")({ validateSearch: searchSchema, component: AuthPage });

function AuthPage() {
  const { role: defaultRole } = Route.useSearch();
  const navigate = useNavigate();
  const { t } = useTheme();
  const [selectedRole, setSelectedRole] = useState<Role>(defaultRole ?? "school");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const ROLE_DEFS: Record<Role, { label: string; desc: string; icon: typeof ShieldCheck }> = {
    admin:   { label: "Admin",          desc: "System administrator",                     icon: ShieldCheck },
    gov:     { label: t("role_gov"),     desc: t("role_gov_desc"),     icon: ShieldCheck },
    school:  { label: t("role_school"),  desc: t("role_school_desc"),  icon: Building2 },
    student: { label: t("role_student"), desc: t("role_student_desc"), icon: GraduationCap },
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const { data: p } = await supabase.from("admin_users").select("role").eq("auth_uid", data.session.user.id).maybeSingle();
        navigate({ to: roleHome((p?.role as Role) ?? "student"), replace: true });
      }
    })();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { toast.error(error.message); setLoading(false); return; }
    const { data: p } = await supabase.from("admin_users").select("role").eq("auth_uid", data.user!.id).maybeSingle();
    const actualRole = (p?.role as Role | null) ?? "student";
    if (actualRole !== selectedRole && !(selectedRole === "gov" && actualRole === "admin")) {
      toast.message(`Signed in as "${actualRole}" — redirecting…`);
    }
    setLoading(false);
    navigate({ to: roleHome(actualRole), replace: true });
  }

  return (
    <div className="auth-grid" style={{ minHeight: "100vh", display: "grid" }}>
      <style>{`
        .auth-grid { grid-template-columns: 1fr 1fr; }
        @media (max-width: 900px) {
          .auth-grid { grid-template-columns: 1fr !important; }
          .auth-left { padding: 28px 22px !important; gap: 24px; }
          .auth-right { padding: 28px 20px !important; }
        }
      `}</style>

      {/* ── LEFT: white panel ─────────────────────────────────────── */}
      <div className="auth-left" style={{
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "48px 56px",
        borderRight: "1px solid #e2e8f0",
      }}>
        {/* Logo + wordmark */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 16, textDecoration: "none" }}>
          <img
            src={ASSETS.logo}
            alt="TSID"
            style={{
              width: 112, height: 112,
              objectFit: "contain",
              filter: "drop-shadow(0 4px 12px rgba(0,51,102,.15))",
            }}
          />
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 24, color: "#003366", letterSpacing: -0.5, lineHeight: 1 }}>TSID</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#1B8F3A", letterSpacing: 0.8, marginTop: 4, textTransform: "uppercase" }}>Tanzania Student ID</div>
          </div>
        </Link>

        {/* Main message */}
        <div>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "clamp(1rem, 1.5vw, 1.25rem)",
            color: "#003366",
            lineHeight: 1.2,
            marginBottom: 20,
          }}>
            {t("auth_subtitle")}
          </h1>

          {/* Role list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {(["gov","school","student"] as Role[]).map((r) => {
              const M = ROLE_DEFS[r];
              return (
                <div key={r} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: "#003366",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <M.icon style={{ width: 18, height: 18, color: "#fff" }} />
                  </div>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 12, color: "#003366" }}>{M.label}</span>
                    <span style={{ fontSize: 12, color: "#64748b" }}> — {M.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={ASSETS.coat} alt="" style={{ width: 28, height: 28, opacity: 0.5 }} />
          <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>Jamhuri ya Muungano wa Tanzania</span>
        </div>
      </div>

      {/* ── RIGHT: blue login panel ───────────────────────────────── */}
      <div className="auth-right" style={{
        background: "linear-gradient(145deg, #003366 0%, #004f99 60%, #0a6aad 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 32px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -60, right: -60, width: 260, height: 260, borderRadius: "50%", background: "rgba(255,255,255,.04)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -80, left: -40, width: 320, height: 320, borderRadius: "50%", background: "rgba(27,143,58,.07)", pointerEvents: "none" }} />

        <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>

          {/* Title */}
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800, fontSize: 24,
            color: "#fff",
            marginBottom: 8, letterSpacing: -0.3,
          }}>
            {t("auth_title")}
          </h2>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.65)", marginBottom: 24 }}>
            {t("auth_subtitle")}
          </p>

          {/* Role selector */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 28 }}>
            {(["gov","school","student"] as Role[]).map((r) => {
              const M = ROLE_DEFS[r];
              const active = selectedRole === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRole(r)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    padding: "12px 8px", borderRadius: 12,
                    border: `2px solid ${active ? "#fff" : "rgba(255,255,255,.2)"}`,
                    background: active ? "rgba(255,255,255,.15)" : "rgba(255,255,255,.05)",
                    color: active ? "#fff" : "rgba(255,255,255,.55)",
                    cursor: "pointer", fontSize: 12, fontWeight: active ? 700 : 500,
                    transition: "all .15s",
                  }}
                >
                  <M.icon style={{ width: 18, height: 18 }} />
                  {M.label}
                </button>
              );
            })}
          </div>

          {/* Form */}
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <Label style={{ color: "rgba(255,255,255,.75)", fontSize: 12, fontWeight: 700, marginBottom: 6, display: "block" }}>
                {t("email_label")}
              </Label>
              <Input
                type="email"
                autoComplete="email"
                placeholder="you@tsid.go.tz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  background: "rgba(255,255,255,.12)",
                  border: "1.5px solid rgba(255,255,255,.2)",
                  color: "#fff",
                  height: 48,
                  fontSize: 14,
                }}
                className="placeholder:text-white/40 focus:border-white/50"
              />
            </div>

            <div>
              <Label style={{ color: "rgba(255,255,255,.75)", fontSize: 12, fontWeight: 700, marginBottom: 6, display: "block" }}>
                {t("password_label")}
              </Label>
              <div style={{ position: "relative" }}>
                <Input
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    background: "rgba(255,255,255,.12)",
                    border: "1.5px solid rgba(255,255,255,.2)",
                    color: "#fff",
                    height: 48,
                    paddingRight: 44,
                    fontSize: 14,
                  }}
                  className="placeholder:text-white/40 focus:border-white/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "rgba(255,255,255,.55)",
                  }}
                >
                  {showPass ? <EyeOff style={{ width: 17, height: 17 }} /> : <Eye style={{ width: 17, height: 17 }} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              style={{
                background: "#fff",
                color: "#003366",
                fontWeight: 800,
                height: 50,
                fontSize: 15,
                borderRadius: 12,
                marginTop: 4,
                border: "none",
                boxShadow: "0 4px 20px rgba(0,0,0,.18)",
                transition: "opacity .15s",
              }}
              className="hover:opacity-90"
            >
              {loading ? t("signing_in") : `${t("sign_in_as")} ${ROLE_DEFS[selectedRole].label}`}
            </Button>
          </form>

          {/* Back to home */}
          <div style={{ textAlign: "center", marginTop: 24 }}>
            <Link to="/" style={{ fontSize: 13, color: "rgba(255,255,255,.5)", textDecoration: "none" }}>
              {t("auth_back_home")}
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
