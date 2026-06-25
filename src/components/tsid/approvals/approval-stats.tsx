import {
Users,
CheckCircle2,
Clock3,
XCircle
} from "lucide-react";

const stats=[

{

title:"Pending",

value:"128",

icon:Clock3,

change:"+18 today"

},

{

title:"Approved",

value:"4,236",

icon:CheckCircle2,

change:"+96 today"

},

{

title:"Rejected",

value:"84",

icon:XCircle,

change:"2 today"

},

{

title:"Applications",

value:"18,492",

icon:Users,

change:"+212 today"

}

];

export default function ApprovalStats(){

return(

<div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

{stats.map(card=>{

const Icon=card.icon;

return(

<div

key={card.title}

className="rounded-xl border bg-card p-6"

>

<div className="flex items-center justify-between">

<div>

<p className="text-sm text-muted-foreground">

{card.title}

</p>

<h2 className="mt-3 text-4xl font-bold">

{card.value}

</h2>

<p className="mt-2 text-sm text-emerald-600">

{card.change}

</p>

</div>

<div className="rounded-xl bg-primary/10 p-3">

<Icon className="h-7 w-7 text-primary"/>

</div>

</div>

</div>

);

})}

</div>

);

}
