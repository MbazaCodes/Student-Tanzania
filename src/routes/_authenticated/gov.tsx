import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/tsid/portal-shell";
import { useTheme } from "@/lib/theme";
import { useCurrentUser } from "@/hooks/use-current-user";
import { LayoutDashboard, Users, Building2, ScrollText, ShieldCheck, CheckSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/gov")({
  component: () => {
    const { t } = useTheme();
    const me = useCurrentUser();

    const items = [
      { to: "/gov",          label: t("nav_dashboard"), icon: <LayoutDashboard className="h-4 w-4" /> },
      { to: "/gov/students", label: t("nav_students"),  icon: <Users className="h-4 w-4" /> },
      { to: "/gov/schools",  label: t("nav_schools"),   icon: <Building2 className="h-4 w-4" /> },
    ];

    // Admins page only for National (tier 0) and Regional (tier 1)
    if (me.tier === 0 || me.tier === 1) {
      items.push({ to: "/gov/admins", label: "Administrators", icon: <ShieldCheck className="h-4 w-4" /> });
    }

    // Approvals (major student changes + school changes)
    items.push({ to: "/gov/approvals", label: "Approvals", icon: <CheckSquare className="h-4 w-4" /> });

    // Audit logs for everyone in gov
    items.push({ to: "/gov/logs", label: t("nav_logs"), icon: <ScrollText className="h-4 w-4" /> });

    // Title reflects tier
    const title =
      me.tier === 1 ? `${me.region} Regional` :
      me.tier === 2 ? `${me.district} District` :
      t("gov_title");

    const subtitle =
      me.tier === 1 ? "REGIONAL ADMIN" :
      me.tier === 2 ? "DISTRICT ADMIN" :
      t("gov_subtitle");

    return <PortalShell title={title} subtitle={subtitle} items={items} />;
  },
});
