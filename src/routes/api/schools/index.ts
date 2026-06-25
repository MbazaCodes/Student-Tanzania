// src/routes/api/schools/index.ts
import { createRoute } from '@tanstack/react-router';
import { schoolService } from '@/lib/gov/school.service';

export const Route = createRoute({
  method: 'GET',
  path: '/api/schools',
  handler: async () => {
    try {
      const schools = await schoolService.getSchools();
      return new Response(JSON.stringify(schools), {
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
