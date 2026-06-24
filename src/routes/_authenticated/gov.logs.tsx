import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/_authenticated/gov/logs")({ component: Page });

const ACTION_COLORS: Record<string,string> = {
  "auth:login":"text-blue-600 bg-blue-50","auth:logout":"text-slate-600 bg-slate-100",
  "student:create":"text-emerald-700 bg-emerald-50","school:create":"text-violet-700 bg-violet-50",
  "application:approve":"text-emerald-700 bg-emerald-50","application:reject":"text-red-700 bg-red-50",
};

function Page() {
  const { t } = useTheme();
  const { data: logs=[] } = useQuery({ queryKey:["gov-logs"], queryFn: async()=>(await supabase.from("activity_logs").select("*").order("created_at",{ascending:false}).limit(300)).data??[] });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-primary" style={{fontFamily:"var(--font-display)"}}>{t("logs_title")}</h1>
        <p className="text-sm text-muted-foreground">{t("logs_sub")} · {logs.length} {t("entries")}</p>
      </div>
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">{t("col_action")}</th><th className="px-4 py-3">{t("col_message")}</th>
                <th className="px-4 py-3">{t("col_by")}</th><th className="px-4 py-3">{t("col_role")}</th><th className="px-4 py-3">{t("col_time")}</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l)=>(
                <tr key={l.id} className="border-t hover:bg-muted/20">
                  <td className="px-4 py-2.5"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${ACTION_COLORS[l.action]??"text-slate-600 bg-slate-100"}`}>{l.action}</span></td>
                  <td className="px-4 py-2.5 text-sm max-w-xs truncate">{l.message??"—"}</td>
                  <td className="px-4 py-2.5 text-sm">{l.by_name??"—"}</td>
                  <td className="px-4 py-2.5 text-xs capitalize text-muted-foreground">{l.by_role??"—"}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{new Date(l.created_at).toLocaleString("en-TZ",{dateStyle:"medium",timeStyle:"short"})}</td>
                </tr>
              ))}
              {logs.length===0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">{t("no_logs")}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
