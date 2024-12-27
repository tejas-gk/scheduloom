import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Teacher, DAYS } from '../types';

interface TeacherFormProps {
  onSubmit: (teacher: Omit<Teacher, 'id'>) => void;
}

export default function TeacherForm({ onSubmit }: TeacherFormProps) {
  const { register, handleSubmit, reset } = useForm<Omit<Teacher, 'id'>>();

  const onSubmitForm = (data: Omit<Teacher, 'id'>) => {
    const constraints = DAYS.reduce((acc, day) => {
      acc[day] = data.constraints[day]?.start && data.constraints[day]?.end
        ? { start: parseInt(data.constraints[day].start), end: parseInt(data.constraints[day].end) }
        : null;
      return acc;
    }, {} as Teacher['constraints']);

    onSubmit({ ...data, constraints });
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      <h2 className="text-xl font-semibold">Add Teacher</h2>
      <div>
        <Label htmlFor="teacherName">Teacher Name</Label>
        <Input id="teacherName" {...register('name', { required: true })} />
      </div>
      {DAYS.map((day) => (
        <div key={day} className="flex space-x-2">
          <Label>{day}</Label>
          <Input
            type="number"
            placeholder="Start"
            min="1"
            max="8"
            {...register(`constraints.${day}.start` as any)}
          />
          <Input
            type="number"
            placeholder="End"
            min="1"
            max="8"
            {...register(`constraints.${day}.end` as any)}
          />
        </div>
      ))}
      <Button type="submit">Add Teacher</Button>
    </form>
  );
}

