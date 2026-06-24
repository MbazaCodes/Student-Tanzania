import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/tsid/site-header";
import { SiteFooter } from "@/components/tsid/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IdCard } from "@/components/tsid/id-card";
import { Search as SearchIcon, AlertCircle, BadgeCheck } from "lucide-react";

const sp = z.object({ id: z.string().optional() });

export const Route = createFileRoute("/search")({
  validateSearch: sp,
  head: () => ({ meta: [
    { title: "Verify a student ID — TSID" },
    { name: "description", content: "Look up any Tanzania Student ID number and instantly verify whether it is genuine." },
    { property: "og:title", content: "Verify a student ID — TSID" },
    { property: "og:description", content: "Instantly verify any TSID number." },
  ]}),
  component: SearchPage,
});

type Result = {
  tsid: string; fullname: string; status: string | null;
  school_official_name: string | null; school_region: string | null;
  region: string | null; level: string | null;
} | null;

function SearchPage() {
  const { id } = Route.useSearch();
  const [q, setQ] = useState(id ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const [searched, setSearched] = useState(false);

  async function run(value: string) {
    if (!value.trim()) return;
    setLoading(true); setSearched(true);
    const { data } = await supabase
      .from("public_student_search")
      .select("tsid,fullname,status,school_official_name,school_region,region,level")
      .eq("tsid", value.trim())
      .maybeSingle();
    setLoading(false);
    setResult((data as Result) ?? null);
  }

  useEffect(() => { if (id) run(id); /* eslint-disable-next-line */ }, [id]);

  return (
    <div className="min-h-screen flex flex-col" id="main-content">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-3xl w-full px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>Verify a student ID</h1>
        <p className="mt-2 text-muted-foreground">Enter a TSID number (e.g. <span className="font-mono">TSID-2026-A7K9P2X</span>) to verify it.</p>
        <form onSubmit={(e) => { e.preventDefault(); run(q); }} className="mt-6 flex gap-2">
          <Input placeholder="TSID-YYYY-XXXXXXX" value={q} onChange={(e) => setQ(e.target.value)} className="font-mono" />
          <Button type="submit" disabled={loading}><SearchIcon className="h-4 w-4 mr-2" /> {loading ? "Searching…" : "Search"}</Button>
        </form>

        {searched && !loading && (
          <div className="mt-8">
            {result ? (
              <div className="rounded-2xl border bg-card p-6">
                <div className="flex items-center gap-2 text-[color:var(--tz-green)] font-semibold"><BadgeCheck className="h-5 w-5" /> Verified record</div>
                <div className="mt-4">
                  <IdCard data={{
                    tsid: result.tsid, fullname: result.fullname,
                    school_name: result.school_official_name,
                    region: result.region ?? result.school_region,
                    level: result.level, status: result.status,
                    dob: null, gender: null, photo_url: null,
                  }} showBack={false} downloadable={false} />
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 text-destructive p-6 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <div>
                  <div className="font-semibold">No record found</div>
                  <div className="text-sm opacity-90">This TSID number is not registered.</div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}