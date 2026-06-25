// src/routes/api/admins/index.ts
import { createRoute } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';

export const Route = createRoute({
  method: 'GET',
  path: '/api/admins',
  handler: async () => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .in('role', ['gov', 'admin', 'gov_region', 'gov_district']);
      
      if (error) throw error;
      return new Response(JSON.stringify(data), {
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
