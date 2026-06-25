import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/tsid/portal-shell";
import { useCurrentUser } from "@/hooks/use-current-user";
import { LayoutDashboard, Building2, Users, ScrollText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/district")({
  component: () => {
    const me = useCurrentUser();
    return (
      <PortalShell
        title={me.district ? `${me.district} District` : "District"}
        subtitle="DISTRICT ADMIN"
        items={[
          { to: "/district",      label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
          { to: "/gov/schools",   label: "Schools",   icon: <Building2 className="h-4 w-4" /> },
          { to: "/gov/students",  label: "Students",  icon: <Users className="h-4 w-4" /> },
          { to: "/gov/approvals", label: "Approvals", icon: <ScrollText className="h-4 w-4" /> },
        ]}
      />
    );
  },
});
