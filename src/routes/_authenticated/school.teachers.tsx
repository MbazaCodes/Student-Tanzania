// src/routes/_authenticated/school.teachers.tsx
import { createFileRoute } from "@tanstack/react-router";
import { SchoolLayout } from "@/components/school";
import { TeacherList } from "@/components/school/teachers";
import { TeacherRegistration } from "@/components/school/teachers";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/school/teachers")({
  component: TeachersPage,
});

function TeachersPage() {
  const [showRegistration, setShowRegistration] = useState(false);
  const [teachers, setTeachers] = useState([]);

  return (
    <SchoolLayout title="Teachers">
      <TeacherList 
        teachers={teachers} 
        onAdd={() => setShowRegistration(true)}
      />
      
      <Dialog open={showRegistration} onOpenChange={setShowRegistration}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Teacher</DialogTitle>
          </DialogHeader>
          <TeacherRegistration 
            onSuccess={() => {
              setShowRegistration(false);
              // Refresh teachers list
            }}
            onCancel={() => setShowRegistration(false)}
          />
        </DialogContent>
      </Dialog>
    </SchoolLayout>
  );
}
