import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/tsid/portal-shell";
import { useTheme } from "@/lib/theme";
import { LayoutDashboard, CreditCard, FileCheck2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/student")({
  component: () => {
    const { t } = useTheme();
    return (
      <PortalShell title={t("student_portal")} items={[
        { to: "/student",             label: t("nav_dashboard"),    icon: <LayoutDashboard className="h-4 w-4" /> },
        { to: "/student/id",          label: t("nav_myid"),         icon: <CreditCard className="h-4 w-4" /> },
        { to: "/student/applications",label: t("nav_applications"), icon: <FileCheck2 className="h-4 w-4" /> },
      ]} />
    );
  },
});
