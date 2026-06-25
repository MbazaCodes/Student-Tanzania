import type { CompletenessResult } from "@/lib/completeness";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

/** Small inline percentage badge. */
export function CompletenessBadge({ result }: { result: CompletenessResult }) {
  const color = result.complete ? "#16a34a" : result.percent >= 60 ? "#F5C400" : "#dc2626";
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: `${color}1a`, color }}>
      {result.complete ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
      {result.percent}%
    </span>
  );
}

/** Full banner prompting the user to complete a profile, with progress bar. */
export function CompletenessBanner({ result, onComplete, entityLabel = "profile" }: {
  result: CompletenessResult;
  onComplete?: () => void;
  entityLabel?: string;
}) {
  if (result.complete) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
        <div className="text-sm font-semibold text-emerald-800">This {entityLabel} is 100% complete.</div>
      </div>
    );
  }
  const color = result.percent >= 60 ? "#F5C400" : "#dc2626";
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0" style={{ color }} />
          <div className="text-sm font-semibold">This {entityLabel} is {result.percent}% complete</div>
        </div>
        {onComplete && (
          <button onClick={onComplete}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90">
            Complete now
          </button>
        )}
      </div>
      {/* Progress bar */}
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${result.percent}%`, background: color }} />
      </div>
      {/* Missing fields */}
      <div className="text-xs text-muted-foreground">
        Missing: {result.missing.join(", ")}
      </div>
    </div>
  );
}
