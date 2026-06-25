// src/routes/api/students/index.ts
import { createRoute } from '@tanstack/react-router';
import { studentService } from '@/lib/gov/student.service';

export const Route = createRoute({
  method: 'GET',
  path: '/api/students',
  handler: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const students = await studentService.getStudents();
      return new Response(JSON.stringify(students), {
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
