import { Button } from "@/components/ui/button";

export default function ApprovalActions(){

return(

<div className="rounded-xl border bg-card p-5">

<h2 className="mb-4 text-lg font-semibold">

Review Actions

</h2>

<div className="grid gap-3">

<Button>

Approve

</Button>

<Button variant="destructive">

Reject

</Button>

<Button variant="secondary">

Request Changes

</Button>

<Button variant="outline">

Assign Officer

</Button>

<Button variant="outline">

Escalate

</Button>

</div>

</div>

);

}
