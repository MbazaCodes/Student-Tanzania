import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { IdCard } from "@/components/tsid/id-card";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/id")({ component: Page });

function Page() {
  const me = useCurrentUser();
  const { data: student } = useQuery({
    enabled: !!me.tsid,
    queryKey: ["my-id", me.tsid],
    queryFn: async () => (await supabase.from("students").select("*").eq("tsid", me.tsid!).maybeSingle()).data,
  });

  if (!student) {
    return <p className="text-sm text-muted-foreground">No student record linked.</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>My TSID Card</h1>
          <p className="text-sm text-muted-foreground">Your national student identification card.</p>
        </div>
        <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" /> Print</Button>
      </div>
      <IdCard data={{
        tsid: student.tsid, fullname: student.fullname,
        school_name: student.school_name, school_code: student.school_code,
        region: student.region, district: student.district,
        dob: student.dob, gender: student.gender,
        nationality: student.nationality, photo_url: student.photo, status: student.status,
        level: student.level, blood_group: student.blood_group,
        enrollment_date: student.enrollment_date, issue_date: student.issue_date,
        parent_name: student.parent_name, parent_nida: student.parent_nida,
        relationship: student.relationship, parent_phone: student.parent_phone,
      }} showBack={true} downloadable={true} />
    </div>
  );
}