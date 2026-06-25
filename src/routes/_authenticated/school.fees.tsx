// src/routes/_authenticated/school.fees.tsx
import { createFileRoute } from "@tanstack/react-router";
import { SchoolLayout } from "@/components/school";
import { SchoolFeeStructure } from "@/components/school/fees";

export const Route = createFileRoute("/_authenticated/school/fees")({
  component: FeesPage,
});

function FeesPage() {
  // Load fee structure from API or use defaults
  const handleSave = async (data) => {
    console.log("Saving fee structure:", data);
    // TODO: Save to API
  };

  return (
    <SchoolLayout title="Fee Structure">
      <SchoolFeeStructure onSave={handleSave} />
    </SchoolLayout>
  );
}
