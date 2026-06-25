import type { ReactNode } from "react";

/**
 * Uniform page header used across every portal page (gov, school, student).
 * Title in Sora display font + primary color, optional subtitle, optional
 * right-side action (button/dialog trigger).
 */
export function PageHeader({ title, subtitle, action }: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between flex-wrap gap-3">
      <div>
        <h1 className="text-2xl font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>
          {title}
        </h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/**
 * Uniform stat card. Colored icon tile (optional) + value + label.
 */
export function StatCard({ label, value, color, icon }: {
  label: string;
  value: ReactNode;
  color?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      {icon && (
        <div
          className="h-9 w-9 rounded-lg flex items-center justify-center text-white mb-3"
          style={{ background: color ?? "var(--tz-navy)" }}
        >
          {icon}
        </div>
      )}
      <div className="text-3xl font-bold" style={!icon && color ? { color } : undefined}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{label}</div>
    </div>
  );
}

/**
 * Uniform "hero" welcome banner — primary navy bg, used on dashboards.
 */
export function HeroBanner({ eyebrow, title, subtitle, action }: {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-primary text-primary-foreground p-6 flex items-center justify-between gap-4 flex-wrap">
      <div>
        {eyebrow && <div className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">{eyebrow}</div>}
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>{title}</h1>
        {subtitle && <p className="text-sm opacity-80 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/**
 * Uniform card container with optional header bar.
 */
export function Panel({ title, action, children, className = "" }: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border bg-card overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
          {title && <span className="font-semibold text-sm">{title}</span>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
