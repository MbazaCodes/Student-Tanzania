// src/routes/_authenticated/regional.tsx
import { createFileRoute } from "@tanstack/react-router";
import { RegionalLayout } from "@/components/regional";

export const Route = createFileRoute("/_authenticated/regional")({
  component: () => {
    return <RegionalLayout region="Dar es Salaam" title="Regional Dashboard" />;
  },
});
