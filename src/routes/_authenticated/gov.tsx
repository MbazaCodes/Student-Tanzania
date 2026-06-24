import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/tsid/portal-shell";
import { useTheme } from "@/lib/theme";
import { LayoutDashboard, Users, Building2, ScrollText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/gov")({
  component: () => {
    const { t } = useTheme();
    return (
      <PortalShell title={t("gov_title")} subtitle={t("gov_subtitle")} items={[
        { to: "/gov",          label: t("nav_dashboard"), icon: <LayoutDashboard className="h-4 w-4" /> },
        { to: "/gov/students", label: t("nav_students"),  icon: <Users className="h-4 w-4" /> },
        { to: "/gov/schools",  label: t("nav_schools"),   icon: <Building2 className="h-4 w-4" /> },
        { to: "/gov/logs",     label: t("nav_logs"),      icon: <ScrollText className="h-4 w-4" /> },
      ]} />
    );
  },
});
