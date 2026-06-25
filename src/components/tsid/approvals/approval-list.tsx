const approvals = [
{
id:"TSID-100234",
student:"Amina Hassan",
school:"Mzumbe Secondary",
region:"Morogoro",
status:"Pending"
},
{
id:"TSID-100235",
student:"John Peter",
school:"Kisutu Secondary",
region:"Dar es Salaam",
status:"Approved"
},
{
id:"TSID-100236",
student:"Neema David",
school:"Feza Girls",
region:"Dar es Salaam",
status:"Changes Requested"
}
];

export default function ApprovalList(){

return(

<div className="rounded-xl border bg-card">

<div className="border-b p-5">

<h2 className="text-lg font-semibold">
Pending Approval Queue
</h2>

</div>

<div className="overflow-x-auto">

<table className="w-full">

<thead>

<tr className="border-b">

<th className="p-3 text-left">TSID</th>

<th className="p-3 text-left">Student</th>

<th className="p-3 text-left">School</th>

<th className="p-3 text-left">Region</th>

<th className="p-3 text-left">Status</th>

</tr>

</thead>

<tbody>

{approvals.map(item=>(

<tr
key={item.id}
className="border-b hover:bg-muted/40 cursor-pointer"
>

<td className="p-3">{item.id}</td>

<td className="p-3">{item.student}</td>

<td className="p-3">{item.school}</td>

<td className="p-3">{item.region}</td>

<td className="p-3">

<span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium">

{item.status}

</span>

</td>

</tr>

))}

</tbody>

</table>

</div>

</div>

);

}
