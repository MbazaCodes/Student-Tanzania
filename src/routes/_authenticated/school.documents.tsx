import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { DocumentsPanel, SCHOOL_DOC_CATEGORIES } from "@/components/tsid/documents-panel";
import { FolderOpen } from "lucide-react";

export const Route = createFileRoute("/_authenticated/school/documents")({ component: Page });

function Page() {
  const me = useCurrentUser();
  if (me.loading) return null;
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-primary text-primary-foreground p-6">
        <div className="flex items-center gap-2"><FolderOpen className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Documents & Publications</h1>
            <p className="text-sm opacity-80">Results, timetables, assessment forms, publications & the information center.</p>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border bg-card p-4">
        <DocumentsPanel scope="school" schoolCode={me.schoolCode} categories={SCHOOL_DOC_CATEGORIES} canUpload={true} />
      </div>
    </div>
  );
}
