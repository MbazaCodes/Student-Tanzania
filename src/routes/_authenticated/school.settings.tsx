import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";

export const Route = createFileRoute("/_authenticated/school/settings")({ component: Page });

function Page() {
  const me = useCurrentUser();

  const { data: school } = useQuery({
    enabled: !!me.schoolCode,
    queryKey: ["school-settings", me.schoolCode],
    queryFn: async () => (await supabase.from("schools").select("*").eq("code", me.schoolCode!).maybeSingle()).data,
  });

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-2xl font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>Settings</h1>
      <div className="rounded-2xl border bg-card p-6 space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">School profile</div>
        {school ? (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-muted-foreground">Code</dt><dd className="font-mono font-bold text-primary">{school.code}</dd></div>
            <div><dt className="text-muted-foreground">Username</dt><dd className="font-mono">{school.username}</dd></div>
            <div className="col-span-2"><dt className="text-muted-foreground">Name</dt><dd className="font-semibold">{school.name}</dd></div>
            <div><dt className="text-muted-foreground">Type</dt><dd>{school.type}</dd></div>
            <div><dt className="text-muted-foreground">Status</dt><dd className="capitalize">{school.status}</dd></div>
            <div><dt className="text-muted-foreground">Region</dt><dd>{school.region}</dd></div>
            <div><dt className="text-muted-foreground">District</dt><dd>{school.district}</dd></div>
            <div><dt className="text-muted-foreground">Ward</dt><dd>{school.ward}</dd></div>
            <div><dt className="text-muted-foreground">Contact</dt><dd>{school.contact ?? "—"}</dd></div>
            <div className="col-span-2"><dt className="text-muted-foreground">Address</dt><dd>{school.address ?? "—"}</dd></div>
          </dl>
        ) : <p className="text-sm text-muted-foreground">No school linked.</p>}
      </div>
    </div>
  );
}