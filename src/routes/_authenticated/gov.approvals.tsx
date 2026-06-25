import { createFileRoute } from "@tanstack/react-router";
import { ApprovalsInbox } from "@/components/tsid/approvals-inbox";

export const Route = createFileRoute("/_authenticated/gov/approvals")({ component: Page });

function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>Approvals</h1>
        <p className="text-sm text-muted-foreground">Review major student changes (name, DOB, TSID, transfers) and school profile changes.</p>
      </div>
      <ApprovalsInbox level="admin" />
    </div>
  );
}
