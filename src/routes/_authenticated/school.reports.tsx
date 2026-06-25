// src/routes/_authenticated/school.reports.tsx
import { createFileRoute } from "@tanstack/react-router";
import { SchoolLayout } from "@/components/school";
import { SchoolReportGenerator } from "@/components/school/reports";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/school/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  // Mock classes - replace with actual data from API
  const classes = [
    { id: "1", name: "Class 5A" },
    { id: "2", name: "Class 5B" },
    { id: "3", name: "Form 3A" },
  ];

  const handleGenerate = async (params) => {
    // TODO: Implement report generation API call
    console.log("Generating report with params:", params);
    // Mock delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success("Report generated successfully!");
  };

  return (
    <SchoolLayout title="Reports">
      <div className="max-w-2xl mx-auto">
        <SchoolReportGenerator 
          classes={classes}
          onGenerate={handleGenerate}
        />
      </div>
    </SchoolLayout>
  );
}
