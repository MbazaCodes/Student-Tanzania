// src/routes/_authenticated/regional.index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { RegionalLayout } from "@/components/regional";
import { RegionalStats, SchoolDistribution, RegionalRecentActivity } from "@/components/regional/dashboard";

export const Route = createFileRoute("/_authenticated/regional/")({
  component: RegionalDashboardPage,
});

function RegionalDashboardPage() {
  const stats = {
    totalSchools: 245,
    totalStudents: 15000,
    activeSchools: 220,
    pendingApprovals: 15,
    studentsGrowth: 12,
    avgAttendance: 92,
  };

  const districts = [
    { name: "Kinondoni", schoolCount: 85, studentCount: 5000, percentage: 35 },
    { name: "Ilala", schoolCount: 70, studentCount: 4200, percentage: 29 },
    { name: "Temeke", schoolCount: 55, studentCount: 3500, percentage: 22 },
    { name: "Ubungo", schoolCount: 35, studentCount: 2300, percentage: 14 },
  ];

  const activities = [
    { id: "1", type: "school_registered", description: "New school registered: Kilimanjaro Academy", time: "2 hours ago", school: "Kilimanjaro Academy" },
    { id: "2", type: "student_enrolled", description: "150 students enrolled in Ilala schools", time: "4 hours ago", school: "Ilala District" },
    { id: "3", type: "approval_pending", description: "5 pending approvals awaiting review", time: "6 hours ago", school: "Various" },
    { id: "4", type: "report_generated", description: "Monthly performance report generated", time: "1 day ago", school: "All Schools" },
  ];

  return (
    <RegionalLayout region="Dar es Salaam" title="Dashboard">
      <div className="space-y-6">
        <RegionalStats stats={stats} />
        <div className="grid lg:grid-cols-2 gap-6">
          <SchoolDistribution districts={districts} />
          <RegionalRecentActivity activities={activities} />
        </div>
      </div>
    </RegionalLayout>
  );
}
