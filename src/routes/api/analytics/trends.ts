// src/routes/api/analytics/trends.ts
import { createRoute } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';

// GET /api/analytics/trends - Get trend data
export const getTrends = createRoute({
  method: 'GET',
  path: '/api/analytics/trends',
  handler: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const period = url.searchParams.get('period') || 'monthly';
      const months = parseInt(url.searchParams.get('months') || '12');

      // Get student data by month
      const { data: students, error: studentError } = await supabase
        .from('students')
        .select('created_at')
        .order('created_at', { ascending: true });

      if (studentError) throw studentError;

      // Get school data by month
      const { data: schools, error: schoolError } = await supabase
        .from('schools')
        .select('created_at')
        .order('created_at', { ascending: true });

      if (schoolError) throw schoolError;

      // Get approval data by month
      const { data: approvals, error: approvalError } = await supabase
        .from('approval_requests')
        .select('created_at')
        .order('created_at', { ascending: true });

      if (approvalError) throw approvalError;

      // Group by month
      const monthMap = new Map();
      const now = new Date();

      // Initialize last N months
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = date.toISOString().slice(0, 7);
        monthMap.set(key, { date: key, students: 0, schools: 0, approvals: 0 });
      }

      // Count students by month
      students?.forEach(s => {
        const date = new Date(s.created_at);
        const key = date.toISOString().slice(0, 7);
        if (monthMap.has(key)) {
          monthMap.get(key).students++;
        }
      });

      // Count schools by month
      schools?.forEach(s => {
        const date = new Date(s.created_at);
        const key = date.toISOString().slice(0, 7);
        if (monthMap.has(key)) {
          monthMap.get(key).schools++;
        }
      });

      // Count approvals by month
      approvals?.forEach(a => {
        const date = new Date(a.created_at);
        const key = date.toISOString().slice(0, 7);
        if (monthMap.has(key)) {
          monthMap.get(key).approvals++;
        }
      });

      const trendData = Array.from(monthMap.values()).map(item => ({
        ...item,
        date: item.date + '-01', // Format as full date
      }));

      return new Response(JSON.stringify(trendData), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to fetch trends' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
});
