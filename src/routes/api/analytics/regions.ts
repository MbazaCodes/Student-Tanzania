// src/routes/api/analytics/regions.ts
import { createRoute } from '@tanstack/react-router';
import { studentService } from '@/lib/gov/student.service';
import { schoolService } from '@/lib/gov/school.service';

// GET /api/analytics/regions - Get regional distribution
export const getRegionalDistribution = createRoute({
  method: 'GET',
  path: '/api/analytics/regions',
  handler: async () => {
    try {
      const [studentStats, schoolStats] = await Promise.all([
        studentService.getStudentStats(),
        schoolService.getSchoolStats(),
      ]);

      const regions = Object.keys(studentStats.byRegion).map(region => ({
        region,
        studentCount: studentStats.byRegion[region] || 0,
        schoolCount: schoolStats.byRegion[region] || 0,
        activeStudents: studentStats.active || 0,
        approvalRate: 0, // TODO: Calculate from approval data
      }));

      return new Response(JSON.stringify(regions), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to fetch regional data' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
});
