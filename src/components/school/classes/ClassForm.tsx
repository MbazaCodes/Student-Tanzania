// src/components/school/classes/ClassForm.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface ClassFormProps {
  teachers: { id: string; name: string }[];
  onSuccess?: () => void;
  onCancel?: () => void;
  editClass?: {
    id: string;
    name: string;
    level: string;
    teacher: string;
  };
}

const LEVELS = [
  'Pre-Primary',
  'Standard 1',
  'Standard 2',
  'Standard 3',
  'Standard 4',
  'Standard 5',
  'Standard 6',
  'Standard 7',
  'Form 1',
  'Form 2',
  'Form 3',
  'Form 4',
  'Form 5',
  'Form 6',
];

export function ClassForm({ teachers, onSuccess, onCancel, editClass }: ClassFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: editClass?.name || '',
    level: editClass?.level || '',
    teacher: editClass?.teacher || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: API call to create/update class
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(editClass ? 'Class updated successfully!' : 'Class created successfully!');
      onSuccess?.();
    } catch (error) {
      toast.error(editClass ? 'Failed to update class' : 'Failed to create class');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editClass ? 'Edit Class' : 'Create New Class'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Class Name *</Label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Class 5A, Form 3B, etc."
              />
            </div>
            <div className="space-y-2">
              <Label>Level *</Label>
              <Select
                value={formData.level}
                onValueChange={(value) => setFormData(prev => ({ ...prev, level: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Class Teacher *</Label>
              <Select
                value={formData.teacher}
                onValueChange={(value) => setFormData(prev => ({ ...prev, teacher: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Saving...' : editClass ? 'Update Class' : 'Create Class'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
