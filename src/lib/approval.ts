export type ApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "changes_requested";

export type ApprovalType =
  | "student_registration"
  | "student_update"
  | "school_registration"
  | "school_update"
  | "transfer"
  | "id_reissue";

export interface ApprovalRecord {

id:string;

type:ApprovalType;

status:ApprovalStatus;

created_at:string;

submitted_by:string;

reviewed_by?:string;

comments?:string;

}
