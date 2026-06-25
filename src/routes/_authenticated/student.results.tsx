// src/routes/_authenticated/student.results.tsx
import { createFileRoute } from "@tanstack/react-router";
import { StudentLayout } from "@/components/student";
import { StudentResults } from "@/components/student/results";

export const Route = createFileRoute("/_authenticated/student/results")({
  component: ResultsPage,
});

function ResultsPage() {
  // Mock data - replace with actual data from API
  const results = [
    {
      id: "1",
      examName: "Mid-Term Examinations",
      term: "Term 1",
      year: "2024",
      performance: "Pass" as const,
      averageScore: 83,
      position: 5,
      totalStudents: 45,
      remarks: "Good performance overall. Shows consistent understanding of core concepts. Keep up the good work!",
      strengths: [
        "Strong in Mathematics and Science",
        "Good problem-solving skills",
        "Consistent attendance"
      ],
      improvements: [
        "Consider more practice in languages",
        "Time management during exams"
      ]
    },
    {
      id: "2",
      examName: "End of Term Examinations",
      term: "Term 2",
      year: "2024",
      performance: "Medium" as const,
      averageScore: 72,
      position: 12,
      totalStudents: 42,
      remarks: "Satisfactory performance with room for improvement. Some subjects need more attention.",
      strengths: [
        "Good understanding of Sciences",
        "Active class participation"
      ],
      improvements: [
        "Focus on improving Mathematics",
        "Practice more with past papers",
        "Group study sessions recommended"
      ]
    },
    {
      id: "3",
      examName: "Annual Examinations",
      term: "Term 3",
      year: "2024",
      performance: "Fair" as const,
      averageScore: 60,
      position: 8,
      totalStudents: 40,
      remarks: "Fair performance. Requires more effort in specific areas. Please consult with teachers for additional support.",
      strengths: [
        "Good in Social Studies",
        "Excellent presentation skills"
      ],
      improvements: [
        "Need to improve in Mathematics and Science",
        "Regular revision schedule recommended",
        "More practice with assignments"
      ]
    }
  ];

  return (
    <StudentLayout title="Results">
      <StudentResults results={results} />
    </StudentLayout>
  );
}
