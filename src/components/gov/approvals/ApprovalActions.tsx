// src/components/gov/approvals/ApprovalActions.tsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ApprovalActionsProps {
  approvalId: string;
  onApprove: (id: string, comments?: string) => Promise<void>;
  onReject: (id: string, comments?: string) => Promise<void>;
  isApproving?: boolean;
  isRejecting?: boolean;
  className?: string;
}

export function ApprovalActions({
  approvalId,
  onApprove,
  onReject,
  isApproving = false,
  isRejecting = false,
  className,
}: ApprovalActionsProps) {
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [comments, setComments] = useState('');

  const handleApprove = async () => {
    try {
      await onApprove(approvalId, comments || undefined);
      setApproveDialogOpen(false);
      setComments('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to approve');
    }
  };

  const handleReject = async () => {
    try {
      await onReject(approvalId, comments || undefined);
      setRejectDialogOpen(false);
      setComments('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reject');
    }
  };

  return (
    <div className={cn('flex gap-2', className)}>
      {/* Approve Button */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="flex-1 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
            disabled={isApproving || isRejecting}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              Approve Request
            </DialogTitle>
            <DialogDescription>
              This action will approve the request. You can add optional comments below.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Add comments (optional)..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleApprove}
              disabled={isApproving}
            >
              {isApproving ? 'Approving...' : 'Confirm Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Button */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="flex-1 border-red-500 text-red-600 hover:bg-red-50"
            disabled={isApproving || isRejecting}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Reject Request
            </DialogTitle>
            <DialogDescription>
              This action will reject the request. Please provide a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Reason for rejection (recommended)..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700"
              onClick={handleReject}
              disabled={isRejecting}
            >
              {isRejecting ? 'Rejecting...' : 'Confirm Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
