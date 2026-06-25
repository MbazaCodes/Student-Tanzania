export type ApprovalStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Changes Requested"

export type ApprovalPriority =
  | "Low"
  | "Medium"
  | "High"
  | "Critical"

export interface Approval {

id:string

studentId:string

studentName:string

school:string

region:string

district:string

type:string

status:ApprovalStatus

priority:ApprovalPriority

submittedBy:string

submittedAt:string

assignedTo?:string

reviewedBy?:string

reviewedAt?:string

comments?:string

}
