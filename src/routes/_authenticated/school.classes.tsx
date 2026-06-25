// src/routes/_authenticated/school.classes.tsx
import { createFileRoute } from "@tanstack/react-router";
import { SchoolLayout } from "@/components/school";
import { ClassList } from "@/components/school/classes";
import { ClassForm } from "@/components/school/classes";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/school/classes")({
  component: ClassesPage,
});

function ClassesPage() {
  const [showForm, setShowForm] = useState(false);
  const [classes, setClasses] = useState([]);
  const [editingClass, setEditingClass] = useState(null);

  // Mock teachers data - replace with actual data from API
  const teachers = [
    { id: "1", name: "John Doe" },
    { id: "2", name: "Jane Smith" },
  ];

  return (
    <SchoolLayout title="Classes">
      <ClassList 
        classes={classes} 
        onAdd={() => {
          setEditingClass(null);
          setShowForm(true);
        }}
        onClassClick={(cls) => {
          setEditingClass(cls);
          setShowForm(true);
        }}
      />
      
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingClass ? "Edit Class" : "Create New Class"}</DialogTitle>
          </DialogHeader>
          <ClassForm 
            teachers={teachers}
            editClass={editingClass}
            onSuccess={() => {
              setShowForm(false);
              setEditingClass(null);
              // Refresh classes list
            }}
            onCancel={() => {
              setShowForm(false);
              setEditingClass(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </SchoolLayout>
  );
}
