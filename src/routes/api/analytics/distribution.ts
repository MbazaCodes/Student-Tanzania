// src/routes/api/analytics/distribution.ts
import { createRoute } from '@tanstack/react-router';
import { schoolService } from '@/lib/gov/school.service';

// GET /api/analytics/distribution - Get distribution data
export const getDistribution = createRoute({
  method: 'GET',
  path: '/api/analytics/distribution',
  handler: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const type = url.searchParams.get('type') || 'school_type';

      const schoolStats = await schoolService.getSchoolStats();

      let distribution = [];
      if (type === 'school_type') {
        distribution = Object.entries(schoolStats.byType).map(([key, count]) => ({
          type: key,
          count,
          percentage: schoolStats.total > 0 ? (count / schoolStats.total) * 100 : 0,
        }));
      } else if (type === 'region') {
        distribution = Object.entries(schoolStats.byRegion).map(([key, count]) => ({
          region: key,
          count,
          percentage: schoolStats.total > 0 ? (count / schoolStats.total) * 100 : 0,
        }));
      } else {
        return new Response(
          JSON.stringify({ error: 'Invalid distribution type' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(JSON.stringify(distribution), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to fetch distribution' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
});
