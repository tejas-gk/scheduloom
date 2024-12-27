import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Class, Subject } from '../types';

interface ClassFormProps {
  onSubmit: (classData: Omit<Class, 'id'>) => void;
  subjects: Subject[];
}

export default function ClassForm({ onSubmit, subjects }: ClassFormProps) {
  const { register, handleSubmit, reset } = useForm<Omit<Class, 'id'>>();
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [labs, setLabs] = useState<{ subjectId: string; duration: number }[]>([]);

  const onSubmitForm = (data: Omit<Class, 'id'>) => {
    onSubmit({ ...data, subjects: selectedSubjects, labs });
    reset();
    setSelectedSubjects([]);
    setLabs([]);
  };

  const addLab = (subjectId: string, duration: number) => {
    setLabs([...labs, { subjectId, duration }]);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      <h2 className="text-xl font-semibold">Add Class</h2>
      <div>
        <Label htmlFor="className">Class Name</Label>
        <Input id="className" {...register('name', { required: true })} />
      </div>
      <div>
        <Label>Subjects</Label>
        <Select
          onValueChange={(value) => setSelectedSubjects([...selectedSubjects, value])}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select subjects" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((subject) => (
              <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ul className="mt-2">
          {selectedSubjects.map((subjectId) => (
            <li key={subjectId}>
              {subjects.find((s) => s.id === subjectId)?.name}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addLab(subjectId, 2)}
                className="ml-2"
              >
                Add Lab
              </Button>
            </li>
          ))}
        </ul>
      </div>
      <Button type="submit">Add Class</Button>
    </form>
  );
}

