import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/lib/theme";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/gov/students")({ component: Page });

function Page() {
  const { t } = useTheme();
  const [search, setSearch] = useState(""); const [regionFilter, setRegionFilter] = useState("");

  const { data: students=[] } = useQuery({ queryKey:["gov-students"], queryFn: async()=>(await supabase.from("students").select("tsid,fullname,dob,gender,photo,status,level,region,district,school_code,school_name,created_at").order("created_at",{ascending:false})).data??[] });
  const { data: schools=[]  } = useQuery({ queryKey:["gov-schools-light"], queryFn: async()=>(await supabase.from("schools").select("code,name,region")).data??[] });

  const regions=[...new Set(schools.map((s)=>s.region).filter(Boolean))] as string[];
  const filtered=students.filter((st)=>{
    const q=search.toLowerCase();
    return(!q||st.fullname.toLowerCase().includes(q)||st.tsid.toLowerCase().includes(q)||(st.school_name??"").toLowerCase().includes(q))
      &&(!regionFilter||(st.region??"")===regionFilter);
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-primary" style={{fontFamily:"var(--font-display)"}}>{t("nat_db")}</h1>
        <p className="text-sm text-muted-foreground">{students.length} {t("nat_db_sub")} {schools.length} {t("schools_in")} {regions.length} {t("regions_text")}</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {label:t("total_students"), value:students.length, color:"var(--tz-navy)"},
          {label:t("active_ids"),     value:students.filter((s)=>s.status==="active").length, color:"var(--tz-green)"},
          {label:t("kpi_schools"),    value:schools.length,  color:"var(--tz-blue)"},
          {label:t("kpi_regions"),    value:regions.length,  color:"var(--tz-gold)"},
        ].map(tile=>(
          <div key={tile.label} className="rounded-xl border bg-card p-4">
            <div className="text-2xl font-bold" style={{color:tile.color}}>{tile.value}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{tile.label}</div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <Input className="max-w-xs" placeholder={t("search_placeholder")} value={search} onChange={e=>setSearch(e.target.value)}/>
        <select className="rounded-md border bg-background px-3 py-2 text-sm" value={regionFilter} onChange={e=>setRegionFilter(e.target.value)}>
          <option value="">{t("all_regions")}</option>
          {regions.map(r=><option key={r} value={r}>{r}</option>)}
        </select>
        <span className="self-center text-xs text-muted-foreground">{filtered.length} {t("results_pl")}</span>
      </div>
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">{t("col_photo")}</th><th className="px-4 py-3">{t("col_student")}</th>
                <th className="px-4 py-3">{t("col_school")}</th><th className="px-4 py-3">{t("col_region")}</th>
                <th className="px-4 py-3">{t("col_level")}</th><th className="px-4 py-3">{t("col_status")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((st)=>(
                <tr key={st.tsid} className="border-t hover:bg-muted/20">
                  <td className="px-4 py-2">{st.photo?<img src={st.photo} className="w-9 h-12 object-cover rounded-md border" alt=""/>:<div className="w-9 h-12 rounded-md border bg-muted flex items-center justify-center text-lg">👤</div>}</td>
                  <td className="px-4 py-3"><div className="font-semibold">{st.fullname}</div><div className="text-xs font-mono text-muted-foreground">{st.tsid}</div><div className="text-xs text-muted-foreground">{st.gender??"—"} · {st.dob??"—"}</div></td>
                  <td className="px-4 py-3"><div className="text-sm font-medium">{st.school_name??"—"}</div><div className="text-xs font-mono text-muted-foreground">{st.school_code??""}</div></td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{st.region??"—"}</td>
                  <td className="px-4 py-3 text-sm">{st.level??"—"}</td>
                  <td className="px-4 py-3"><span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.status==="active"?"bg-emerald-100 text-emerald-800":"bg-red-100 text-red-800"}`}>{st.status==="active"?t("active"):t("inactive")}</span></td>
                </tr>
              ))}
              {filtered.length===0&&<tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">{search||regionFilter?t("no_match"):t("no_students_yet")}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
