import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Timetable, Subject, DAYS, PERIODS_PER_DAY } from '../types';

interface TimetableEditFormProps {
  timetable: Timetable;
  subjects: Subject[];
  onSave: (editedTimetable: Timetable) => void;
  onCancel: () => void;
}

export default function TimetableEditForm({ timetable, subjects, onSave, onCancel }: TimetableEditFormProps) {
  const [editedTimetable, setEditedTimetable] = useState<Timetable>(timetable);

  const handleSlotChange = (day: string, period: number, subjectId: string | null) => {
    const updatedSlots = editedTimetable.slots.map(slot => {
      if (slot.day === day && slot.period === period) {
        return { ...slot, subjectId };
      }
      return slot;
    });
    setEditedTimetable({ ...editedTimetable, slots: updatedSlots });
  };

  const removeSlot = (day: string, period: number) => {
    handleSlotChange(day, period, null);
  };

  return (
    <div className="mt-4">
      <h2 className="text-xl font-semibold mb-2">Edit Timetable</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Day / Period</TableHead>
            {Array.from({ length: PERIODS_PER_DAY }, (_, i) => (
              <TableHead key={i}>{i + 1}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {DAYS.map((day) => (
            <TableRow key={day}>
              <TableCell>{day}</TableCell>
              {Array.from({ length: PERIODS_PER_DAY }, (_, period) => {
                const slot = editedTimetable.slots.find((s) => s.day === day && s.period === period);
                return (
                  <TableCell key={period}>
                    <Select
                      value={slot?.subjectId || ''}
                      onValueChange={(value) => handleSlotChange(day, period, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Empty</SelectItem>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => removeSlot(day, period)}
                      variant="outline"
                      size="sm"
                      className="mt-1"
                    >
                      Remove
                    </Button>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="mt-4">
        <Button onClick={() => onSave(editedTimetable)} className="mr-2">Save</Button>
        <Button onClick={onCancel} variant="outline">Cancel</Button>
      </div>
    </div>
  );
}

