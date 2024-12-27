import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Book, Beaker, X, GraduationCap, Building } from 'lucide-react';
import { Class, Subject, Room } from '../types';
import { toast } from '@/hooks/use-toast';

interface ClassFormProps {
  onSubmit: (classData: Omit<Class, 'id'>) => void;
  subjects: Subject[];
  rooms: Room[];
  existingClasses: Class[]; // Add this to check room allocation
}

export default function ClassForm({ onSubmit, subjects, rooms, existingClasses }: ClassFormProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Omit<Class, 'id'>>();
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [labs, setLabs] = useState<{ subject_id: string; duration: number }[]>([]);

  const availableRooms = rooms.filter(room => 
    !existingClasses.some(cls => cls.room_id === room.id)
  );

  const onSubmitForm = (data: Omit<Class, 'id'>) => {
    if (selectedSubjects.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one subject",
        variant: "destructive"
      });
      return;
    }

    if (!selectedRoom) {
      toast({
        title: "Error",
        description: "Please select a room for the class",
        variant: "destructive"
      });
      return;
    }

    onSubmit({ 
      ...data, 
      subjects: selectedSubjects, 
      labs,
      room_id: selectedRoom 
    });
    reset();
    setSelectedSubjects([]);
    setSelectedRoom('');
    setLabs([]);
  };

  const addLab = (subject_id: string, duration: number) => {
    setLabs([...labs, { subject_id, duration }]);
  };

  const removeSubject = (subject_id: string) => {
    setSelectedSubjects(selectedSubjects.filter(id => id !== subject_id));
    setLabs(labs.filter(lab => lab.subject_id !== subject_id));
  };

  return (
    <Card className="w-full bg-white shadow-xl border-t-4 border-t-purple-500">
      <CardHeader className="border-b border-gray-100 bg-white/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-100">
            <GraduationCap className="h-6 w-6 text-purple-600" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
            Add New Class
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmitForm)}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Class Name Input - 2 columns */}
            <div className="lg:col-span-2">
              <Label htmlFor="className" className="text-sm font-semibold text-gray-700">
                Class Name
              </Label>
              <Input
                id="className"
                className="mt-1 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                placeholder="Enter class name"
                {...register('name', { required: true })}
              />
            </div>

            {/* Room Selection - 3 columns */}
            {/* Updated Room Selection with availability check */}
            <div className="lg:col-span-3">
              <Label className="text-sm font-semibold text-gray-700">Assigned Room</Label>
              <Select onValueChange={setSelectedRoom} value={selectedRoom}>
                <SelectTrigger className="mt-1 border-gray-200 focus:border-purple-500">
                  <SelectValue placeholder={availableRooms.length === 0 ? "No rooms available" : "Select a room"} />
                </SelectTrigger>
                <SelectContent>
                  {availableRooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-purple-600" />
                        {room.name} - {room.building} (Floor {room.floor})
                        {room.type === 'lab' && <Beaker className="h-4 w-4 text-purple-600" />}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableRooms.length === 0 && (
                <p className="text-sm text-red-500 mt-1">
                  All rooms are currently allocated. Please add more rooms or free up existing ones.
                </p>
              )}
            </div>

            {/* Subject Selection - 4 columns */}
            <div className="lg:col-span-4">
              <Label className="text-sm font-semibold text-gray-700">Add Subjects</Label>
              <Select
                onValueChange={(value) => {
                  if (!selectedSubjects.includes(value)) {
                    setSelectedSubjects([...selectedSubjects, value]);
                  }
                }}
              >
                <SelectTrigger className="mt-1 border-gray-200 focus:border-purple-500">
                  <SelectValue placeholder="Select subjects to add" />
                </SelectTrigger>
                <SelectContent>
                  {subjects
                    .filter(subject => !selectedSubjects.includes(subject.id))
                    .map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Subjects Display - 3 columns */}
            <div className="lg:col-span-3">
              <Label className="text-sm font-semibold text-gray-700 mb-1 block">Selected Subjects</Label>
              <div className="space-y-2 max-h-24 overflow-y-auto">
                {selectedSubjects.map((subject_id) => {
                  const subject = subjects.find((s) => s.id === subject_id);
                  const hasLab = labs.some(lab => lab.subject_id === subject_id);
                  
                  return (
                    <div key={subject_id} className="flex items-center justify-between p-2 rounded-lg bg-purple-50 border border-purple-100">
                      <div className="flex items-center gap-2">
                        <Book className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">{subject?.name}</span>
                        {hasLab && <Beaker className="h-4 w-4 text-purple-600" />}
                      </div>
                      <div className="flex items-center gap-2">
                        {!hasLab && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => addLab(subject_id, 2)}
                            className="h-6 px-2 text-purple-600 hover:bg-purple-100"
                          >
                            <Beaker className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSubject(subject_id)}
                          className="h-6 w-6 text-gray-400 hover:text-red-500 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {selectedSubjects.length === 0 && (
                  <div className="text-sm text-gray-400 p-2 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    No subjects selected
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-6">
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
              Create Class
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}