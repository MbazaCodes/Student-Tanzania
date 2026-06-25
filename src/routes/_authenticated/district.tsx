// src/routes/_authenticated/district.tsx
import { createFileRoute } from "@tanstack/react-router";
import { DistrictLayout } from "@/components/district";

export const Route = createFileRoute("/_authenticated/district")({
  component: () => {
    return <DistrictLayout district="Kinondoni" region="Dar es Salaam" title="District Dashboard" />;
  },
});
