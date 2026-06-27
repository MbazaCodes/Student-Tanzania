import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/tsid/portal-shell";
import { LayoutDashboard, Users, TrendingUp, FileBarChart, FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/teacher")({
  component: () => (
    <PortalShell title="Teacher / Educator" subtitle="EDUCATOR" items={[
      { to: "/teacher",            label: "Dashboard",        icon: <LayoutDashboard className="h-4 w-4" /> },
      { to: "/teacher/students",   label: "My Students",      icon: <Users className="h-4 w-4" /> },
      { to: "/teacher/development", label: "Development Tool", icon: <TrendingUp className="h-4 w-4" /> },
      { to: "/teacher/reports",    label: "Reports",          icon: <FileBarChart className="h-4 w-4" /> },
      { to: "/teacher/requests",   label: "Requests",         icon: <FileText className="h-4 w-4" /> },
    ]} />
  ),
});
