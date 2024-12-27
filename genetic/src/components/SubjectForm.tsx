import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Subject, Teacher, DAYS } from '../types';

interface SubjectFormProps {
  onSubmit: (subject: Omit<Subject, 'id' | 'color'>) => void;
  teachers: Teacher[];
}

export default function SubjectForm({ onSubmit, teachers }: SubjectFormProps) {
  const { register, control, handleSubmit, reset } = useForm<Omit<Subject, 'id' | 'color'>>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "constraints",
  });

  const onSubmitForm = (data: Omit<Subject, 'id' | 'color'>) => {
    onSubmit(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      <h2 className="text-xl font-semibold">Add Subject</h2>
      <div>
        <Label htmlFor="subjectName">Subject Name</Label>
        <Input id="subjectName" {...register('name', { required: true })} />
      </div>
      <div>
        <Label htmlFor="subjectTeacher">Teacher</Label>
        <Select onValueChange={(value) => register('teacherId').onChange({ target: { value } })}>
          <SelectTrigger id="subjectTeacher">
            <SelectValue placeholder="Select teacher" />
          </SelectTrigger>
          <SelectContent>
            {teachers.map((teacher) => (
              <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Constraints</Label>
        {fields.map((field, index) => (
          <div key={field.id} className="flex space-x-2 mt-2">
            <Select onValueChange={(value) => register(`constraints.${index}.day`).onChange({ target: { value } })}>
              <SelectTrigger>
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((day) => (
                  <SelectItem key={day} value={day}>{day}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Start"
              min="1"
              max="8"
              {...register(`constraints.${index}.start` as const, { valueAsNumber: true })}
            />
            <Input
              type="number"
              placeholder="End"
              min="1"
              max="8"
              {...register(`constraints.${index}.end` as const, { valueAsNumber: true })}
            />
            <Button type="button" variant="outline" onClick={() => remove(index)}>Remove</Button>
          </div>
        ))}
        <Button type="button" onClick={() => append({ day: '', start: 1, end: 8 })} className="mt-2">
          Add Constraint
        </Button>
      </div>
      <Button type="submit">Add Subject</Button>
    </form>
  );
}

