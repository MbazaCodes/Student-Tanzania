import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useTheme } from "@/lib/theme";
import { Users, Building2, FileCheck2, BadgeCheck, TrendingUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/gov/")({ component: GovDashboard });

function GovDashboard() {
  const me = useCurrentUser();
  const { t } = useTheme();

  const { data: kpis } = useQuery({
    queryKey: ["gov-kpis"],
    queryFn: async () => {
      const [students, schools, apps, active, logs] = await Promise.all([
        supabase.from("students").select("tsid",{count:"exact",head:true}),
        supabase.from("schools").select("code",{count:"exact",head:true}),
        supabase.from("applications").select("id",{count:"exact",head:true}).eq("status","pending"),
        supabase.from("students").select("tsid",{count:"exact",head:true}).eq("status","active"),
        supabase.from("activity_logs").select("*").order("created_at",{ascending:false}).limit(6),
      ]);
      return { students: students.count??0, schools: schools.count??0, apps: apps.count??0, active: active.count??0, recentLogs: logs.data??[] };
    },
  });
  const { data: schoolsData=[] } = useQuery({ queryKey:["gov-schools-dash"], queryFn: async()=>(await supabase.from("schools").select("code,name,region,status").order("name").limit(5)).data??[] });
  const { data: regionData=[] } = useQuery({ queryKey:["gov-regions"], queryFn: async()=>{
    const {data:st}=await supabase.from("students").select("region");
    const {data:sc}=await supabase.from("schools").select("region");
    return [...new Set([...(st??[]).map((x)=>x.region),...(sc??[]).map((x)=>x.region)].filter(Boolean))] as string[];
  }});

  const tiles = [
    {label:t("kpi_students"), value:kpis?.students??"—", icon:Users,       color:"var(--tz-green)"},
    {label:t("kpi_active"),   value:kpis?.active??"—",   icon:BadgeCheck,   color:"var(--tz-blue)"},
    {label:t("kpi_schools"),  value:kpis?.schools??"—",  icon:Building2,    color:"var(--tz-navy)"},
    {label:t("kpi_pending_apps"),value:kpis?.apps??"—",  icon:FileCheck2,   color:"var(--tz-gold)"},
  ];

  const ACTION_COLORS: Record<string,string> = {
    "school:create":"text-violet-700 bg-violet-50","student:create":"text-emerald-700 bg-emerald-50",
    "auth:login":"text-blue-700 bg-blue-50","application:approve":"text-emerald-700 bg-emerald-50","application:reject":"text-red-700 bg-red-50",
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-primary text-primary-foreground p-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">{t("gov_title")}</div>
          <h1 className="text-2xl font-bold" style={{fontFamily:"var(--font-display)"}}>{t("gov_welcome")}</h1>
          <p className="text-sm opacity-80 mt-1">{t("welcome_msg")}, <strong>{me.fullName??"Administrator"}</strong> · {t("gov_welcome_sub")}</p>
        </div>
        <Button asChild variant="secondary"><Link to="/gov/schools"><Plus className="h-4 w-4 mr-1"/>{t("gov_register_school")}</Link></Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((tile)=>(
          <div key={tile.label} className="rounded-2xl border bg-card p-5">
            <div className="h-9 w-9 rounded-lg flex items-center justify-center text-white" style={{background:tile.color}}><tile.icon className="h-4 w-4"/></div>
            <div className="mt-3 text-3xl font-bold">{tile.value}</div>
            <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{tile.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          {label:t("kpi_regions"),  value:regionData.length, icon:TrendingUp},
          {label:t("kpi_approved"), value:"—",                icon:BadgeCheck},
          {label:t("kpi_verified"), value:schoolsData.filter((s)=>s.status==="active").length, icon:Building2},
        ].map(tile=>(
          <div key={tile.label} className="rounded-xl border bg-card p-4 flex items-center gap-3">
            <tile.icon className="h-6 w-6 text-muted-foreground flex-shrink-0"/>
            <div><div className="text-xl font-bold">{tile.value}</div><div className="text-xs text-muted-foreground">{tile.label}</div></div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <span className="font-semibold text-sm">🏫 {t("registered_schools")}</span>
            <Link to="/gov/schools" className="text-xs text-primary hover:underline">{t("manage_arrow")}</Link>
          </div>
          {schoolsData.length===0 ? <p className="px-4 py-8 text-sm text-center text-muted-foreground">{t("no_schools")}</p> : (
            <table className="w-full text-sm"><thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="px-4 py-2 text-left">{t("col_code")}</th><th className="px-4 py-2 text-left">{t("col_school")}</th><th className="px-4 py-2 text-left">{t("col_region")}</th><th className="px-4 py-2 text-left">{t("col_status")}</th></tr>
            </thead><tbody>
              {schoolsData.map((s)=>(
                <tr key={s.code} className="border-t">
                  <td className="px-4 py-2 font-mono text-xs text-primary font-bold">{s.code}</td>
                  <td className="px-4 py-2 font-medium">{s.name}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{s.region??"—"}</td>
                  <td className="px-4 py-2"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.status==="active"?"bg-emerald-100 text-emerald-800":"bg-amber-100 text-amber-800"}`}>{s.status==="active"?t("active"):t("pending")}</span></td>
                </tr>
              ))}
            </tbody></table>
          )}
        </div>

        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <span className="font-semibold text-sm">📋 {t("recent_activity")}</span>
            <Link to="/gov/logs" className="text-xs text-primary hover:underline">{t("see_all")}</Link>
          </div>
          {(kpis?.recentLogs??[]).length===0 ? <p className="px-4 py-8 text-sm text-center text-muted-foreground">{t("no_activity")}</p> : (
            <div className="divide-y">
              {(kpis?.recentLogs??[]).map((l)=>(
                <div key={l.id} className="px-4 py-3 flex items-start gap-3">
                  <span className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap flex-shrink-0 ${ACTION_COLORS[l.action]??"bg-muted text-muted-foreground"}`}>
                    {l.action.split(":")[1]??l.action}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm truncate">{l.message??l.action}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{l.by_name??"system"} · {new Date(l.created_at).toLocaleString("en-TZ",{dateStyle:"short",timeStyle:"short"})}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
