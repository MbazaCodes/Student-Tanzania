// src/routes/api/approvals/index.ts
import { createRoute } from '@tanstack/react-router';
import { approvalService } from '@/lib/gov/approval.service';

export const Route = createRoute({
  method: 'GET',
  path: '/api/approvals',
  handler: async () => {
    try {
      const approvals = await approvalService.getApprovals();
      return new Response(JSON.stringify(approvals), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
});
