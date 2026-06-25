// src/routes/api/reports/index.ts
import { createRoute } from '@tanstack/react-router';

export const Route = createRoute({
  method: 'GET',
  path: '/api/reports',
  handler: async () => {
    try {
      return new Response(JSON.stringify([]), {
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
