import { ShieldCheck } from "lucide-react";

export default function ApprovalDashboard() {

return(

<div className="rounded-xl border bg-card">

<div className="p-8">

<div className="flex items-center gap-4">

<div className="rounded-xl bg-primary/10 p-4">

<ShieldCheck className="h-8 w-8 text-primary"/>

</div>

<div>

<h1 className="text-3xl font-bold">

Government Approval Centre

</h1>

<p className="text-muted-foreground mt-1">

National workflow for reviewing and approving TSID applications.

</p>

</div>

</div>

</div>

</div>

);

}
