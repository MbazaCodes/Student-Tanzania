// src/routes/api/approvals/bulk.ts
import { createRoute } from '@tanstack/react-router';

export const Route = createRoute({
  method: 'POST',
  path: '/api/approvals/bulk',
  handler: async ({ request }) => {
    try {
      const body = await request.json();
      return new Response(JSON.stringify({ message: 'Bulk action processed', count: body.ids?.length || 0 }), {
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
