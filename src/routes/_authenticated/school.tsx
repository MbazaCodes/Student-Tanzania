import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/tsid/portal-shell";
import { useTheme } from "@/lib/theme";
import { LayoutDashboard, Users, FileCheck2, Settings, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/school")({
  component: () => {
    const { t } = useTheme();
    return (
      <PortalShell title={t("school_portal")} items={[
        { to: "/school",          label: t("nav_dashboard"),   icon: <LayoutDashboard className="h-4 w-4" /> },
        { to: "/school/students", label: t("nav_students"),    icon: <Users className="h-4 w-4" /> },
        { to: "/school/applications", label: t("nav_applications"), icon: <FileCheck2 className="h-4 w-4" /> },
        { to: "/school/settings", label: t("nav_settings"),   icon: <Settings className="h-4 w-4" /> },
      ]} />
    );
  },
});
