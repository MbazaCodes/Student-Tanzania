// src/routes/_authenticated/district.index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { DistrictLayout } from "@/components/district";
import { DistrictStats, DistrictSchoolList, DistrictRecentActivity } from "@/components/district/dashboard";

export const Route = createFileRoute("/_authenticated/district/")({
  component: DistrictDashboardPage,
});

function DistrictDashboardPage() {
  const stats = {
    totalSchools: 85,
    totalStudents: 5000,
    activeSchools: 78,
    pendingApprovals: 5,
    studentsGrowth: 8,
    thisMonthEnrollments: 120,
  };

  const schools = [
    { id: "1", name: "International School of Tanzania", code: "IST001", studentCount: 850, status: "active" },
    { id: "2", name: "Dar es Salaam High School", code: "DHS002", studentCount: 620, status: "active" },
    { id: "3", name: "Kinondoni Primary School", code: "KPS003", studentCount: 480, status: "active" },
    { id: "4", name: "Mwananyamala Secondary", code: "MSS004", studentCount: 350, status: "suspended" },
    { id: "5", name: "Ubungo Academy", code: "UBA005", studentCount: 290, status: "active" },
  ];

  const activities = [
    { id: "1", type: "student_registered", description: "45 new students registered at IST", time: "3 hours ago" },
    { id: "2", type: "approval_pending", description: "3 approval requests pending review", time: "5 hours ago" },
    { id: "3", type: "report_generated", description: "Weekly attendance report generated", time: "1 day ago" },
    { id: "4", type: "school_updated", description: "School profile updated: DHS002", time: "2 days ago" },
  ];

  return (
    <DistrictLayout district="Kinondoni" region="Dar es Salaam" title="Dashboard">
      <div className="space-y-6">
        <DistrictStats stats={stats} />
        <div className="grid lg:grid-cols-2 gap-6">
          <DistrictSchoolList schools={schools} />
          <DistrictRecentActivity activities={activities} />
        </div>
      </div>
    </DistrictLayout>
  );
}
