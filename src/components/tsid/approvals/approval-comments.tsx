// src/components/tsid/approvals/approval-comments.tsx
import { ReactNode } from "react";

interface ApprovalCommentsProps {
  approvalId: string;
  comments?: Array<{ id: string; text: string; author: string; createdAt: string }>;
  onAddComment?: (text: string) => void;
}

export default function ApprovalComments({ approvalId, comments = [], onAddComment }: ApprovalCommentsProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Comments</h3>
      {comments.length === 0 && (
        <p className="text-sm text-muted-foreground">No comments yet</p>
      )}
      {comments.map((comment) => (
        <div key={comment.id} className="p-3 bg-muted/30 rounded-lg">
          <div className="text-sm">{comment.text}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {comment.author}  {new Date(comment.createdAt).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
}
