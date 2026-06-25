import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ApprovalFilters() {
  return (
    <div className="rounded-xl border bg-card p-5">
      <h2 className="mb-4 text-lg font-semibold">
        Search & Filters
      </h2>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">

        <Input placeholder="Search TSID / Student..." />

        <Input placeholder="School" />

        <Input placeholder="Region" />

        <Input placeholder="District" />

        <Input placeholder="Approval Type" />

        <Input placeholder="Status" />

      </div>

      <div className="mt-5 flex gap-3">

        <Button>
          Search
        </Button>

        <Button variant="outline">
          Reset
        </Button>

        <Button variant="secondary">
          Export Excel
        </Button>

      </div>

    </div>
  );
}
