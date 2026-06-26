import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/tsid/portal-shell";
import { LayoutDashboard, FileText, Users, Wallet, FileBarChart } from "lucide-react";

export const Route = createFileRoute("/_authenticated/parent")({
  component: () => (
    <PortalShell title="Parent / Guardian" subtitle="GUARDIAN" items={[
      { to: "/parent",          label: "Dashboard",         icon: <LayoutDashboard className="h-4 w-4" /> },
      { to: "/parent/requests", label: "Requests",          icon: <FileText className="h-4 w-4" /> },
      { to: "/parent/children", label: "My Children",       icon: <Users className="h-4 w-4" /> },
      { to: "/parent/fees",     label: "Fees / Contribution", icon: <Wallet className="h-4 w-4" /> },
      { to: "/parent/reports",  label: "Reports",           icon: <FileBarChart className="h-4 w-4" /> },
    ]} />
  ),
});
