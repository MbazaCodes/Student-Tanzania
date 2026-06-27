import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Users, GraduationCap, TrendingUp, Star } from "lucide-react";
import { DocumentsPanel, PARENT_DOC_CATEGORIES } from "@/components/tsid/documents-panel";

export const Route = createFileRoute("/_authenticated/parent/")({ component: Page });

export function useMyChildren() {
  const me = useCurrentUser();
  return useQuery({
    enabled: !!me.userId,
    queryKey: ["my-children", me.userId],
    queryFn: async () => {
      const { data: links } = await supabase.from("parent_children").select("tsid,relationship");
      const tsids = (links ?? []).map((l: any) => l.tsid);
      if (tsids.length === 0) return [];
      const { data: students } = await supabase.from("students")
        .select("tsid,fullname,photo,level,status,school_name,region,district,talent_primary")
        .in("tsid", tsids);
      return students ?? [];
    },
  });
}

function Page() {
  const me = useCurrentUser();
  const { data: children = [] } = useMyChildren();

  if (me.loading) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-primary text-primary-foreground p-6">
        <div className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">Parent / Guardian Portal</div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Karibu, {me.fullName ?? "Guardian"}! 👋</h1>
        <p className="text-sm opacity-80 mt-1">Follow your {children.length === 1 ? "child's" : "children's"} progress, results, and requests.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Stat icon={Users} label="My Children" value={children.length} color="#002855" />
        <Stat icon={GraduationCap} label="Active" value={children.filter((c: any) => c.status === "active").length} color="#1EB53A" />
        <Stat icon={Star} label="With Talent" value={children.filter((c: any) => c.talent_primary).length} color="#f59e0b" />
      </div>

      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <span className="font-semibold text-sm">My Children</span>
          <Link to="/parent/children" className="text-xs text-primary hover:underline">View all →</Link>
        </div>
        <div className="divide-y">
          {children.length === 0 && <div className="p-10 text-center text-muted-foreground text-sm">No children linked yet. Contact your school to link your children.</div>}
          {children.map((c: any) => (
            <Link key={c.tsid} to="/parent/children" className="flex items-center gap-3 p-4 hover:bg-muted/20">
              <div className="h-12 w-12 rounded-xl overflow-hidden bg-muted border shrink-0 flex items-center justify-center">
                {c.photo ? <img src={c.photo} alt="" className="h-full w-full object-cover" /> : <span className="text-xl">👤</span>}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate">{c.fullname}</div>
                <div className="text-xs text-muted-foreground">{c.level} · {c.school_name}</div>
              </div>
              <span className="text-xs capitalize px-2 py-0.5 rounded-full" style={{ background: c.status === "active" ? "#dcfce7" : "#fee2e2", color: c.status === "active" ? "#166534" : "#991b1b" }}>{c.status}</span>
            </Link>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30 font-semibold text-sm flex items-center justify-between">
          <span>🪪 Guardian Verification</span>
        </div>
        <div className="p-4">
          <p className="text-xs text-muted-foreground mb-3">Upload your National ID and your child's birth certificate to become a verified guardian.</p>
          <DocumentsPanel scope="parent" ownerRef={me.ref} categories={PARENT_DOC_CATEGORIES} canUpload={true} />
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="h-9 w-9 rounded-lg flex items-center justify-center text-white" style={{ background: color }}><Icon className="h-4 w-4" /></div>
      <div className="mt-3 text-3xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{label}</div>
    </div>
  );
}
