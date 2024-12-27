import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Timetable, Subject, Teacher, Class, Room, DAYS, PERIODS_PER_DAY } from '../types';
import { BeakerIcon, XCircleIcon, Trash2Icon, Save, X, Building } from 'lucide-react';
import { dataService } from '@/services/dataService';
import { toast } from '@/hooks/use-toast';

interface TimetableEditFormProps {
  timetable: Timetable;
  subjects: Subject[];
  teachers: Teacher[];
  classes: Class[];
  rooms: Room[];
  onSave: (editedTimetable: Timetable) => void;
  onCancel: () => void;
  onDelete: (timetableId: string) => void;
}

export default function TimetableEditForm({ 
  timetable, 
  subjects, 
  teachers, 
  classes,
  rooms,
  onSave, 
  onCancel,
  onDelete 
}: TimetableEditFormProps) {
  const [editedTimetable, setEditedTimetable] = useState<Timetable>(timetable);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentClass, setCurrentClass] = useState<Class | null>(null);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);

  useEffect(() => {
    // Ensure we're working with the correct is_lab property format
    const normalizedSlots = timetable.slots.map(slot => ({
      ...slot,
      is_lab: Boolean(slot.is_lab), // Ensure boolean type
    }));

    setEditedTimetable({
      ...timetable,
      slots: normalizedSlots
    });

    const classData = classes.find(c => c.id === timetable.class_id);
    setCurrentClass(classData || null);

    const otherClassRooms = classes
      .filter(c => c.id !== timetable.class_id)
      .map(c => c.room_id);
    
    const availableRooms = rooms.filter(room => 
      !otherClassRooms.includes(room.id) || 
      currentClass?.room_id === room.id
    );
    setAvailableRooms(availableRooms);
  }, [timetable, classes, rooms]);

  const handleSlotChange = (day: string, period: number, subject_id: string | null, is_lab: boolean) => {
    const updatedSlots = editedTimetable.slots.map(slot => {
      if (slot.day === day && slot.period === period) {
        return { 
          ...slot, 
          subject_id, 
          is_lab // Ensure is_lab is included in the update
        };
      }
      return slot;
    });
    setEditedTimetable({ ...editedTimetable, slots: updatedSlots });
  };

  const handleRoomChange = async (roomId: string) => {
    try {
      if (!currentClass) return;

      // Update the class with the new room
      await dataService.updateClass(currentClass.id, {
        ...currentClass,
        room_id: roomId
      });

      toast({
        title: "Success",
        description: "Room updated successfully",
      });

      // Update local state
      setCurrentClass({
        ...currentClass,
        room_id: roomId
      });
    } catch (error) {
      console.error('Error updating room:', error);
      toast({
        title: "Error",
        description: "Failed to update room",
        variant: "destructive"
      });
    }
  };

  const getSlot = (day: string, period: number) => {
    return editedTimetable.slots.find(slot => slot.day === day && slot.period === period);
  };

  const removeSlot = (day: string, period: number) => {
    handleSlotChange(day, period, null, false);
  };

  const handleSave = async () => {
    try {
      if (editedTimetable.id) {
        // Ensure all slots have the correct is_lab property before saving
        const normalizedSlots = editedTimetable.slots.map(slot => ({
          ...slot,
          is_lab: Boolean(slot.is_lab),
          is_interval: Boolean(slot.is_interval)
        }));

        const updatedTimetable = {
          ...editedTimetable,
          slots: normalizedSlots
        };

        await dataService.updateTimetable(editedTimetable.id, updatedTimetable);
        onSave(updatedTimetable);
        toast({
          title: "Success",
          description: "Timetable updated successfully",
        });
      } else {
        throw new Error('Timetable ID is undefined');
      }
    } catch (error) {
      console.error('Error saving timetable:', error);
      toast({
        title: "Error",
        description: "Failed to save timetable",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      if (editedTimetable.id) {
        await dataService.deleteTimetable(editedTimetable.id);
      } else {
        throw new Error('Timetable ID is undefined');
      }
      await dataService.deleteClass(editedTimetable.class_id);
      
      onDelete(editedTimetable.id);
      toast({
        title: "Success",
        description: "Timetable and associated class deleted successfully",
      });
      window.location.reload();
    } catch (error) {
      console.error('Error deleting timetable and class:', error);
      toast({
        title: "Error",
        description: "Failed to delete timetable and class",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getCurrentRoom = () => {
    if (!currentClass) return null;
    return rooms.find(room => room.id === currentClass.room_id);
  };

  return (
    <Card className="w-full bg-white shadow-lg rounded-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl font-bold">
            Edit Timetable - {classes.find(c => c.id === editedTimetable.class_id)?.name}
          </CardTitle>
          <div className="flex gap-4">
            <div className="flex-1">
              <Select onValueChange={handleRoomChange} value={currentClass?.room_id || ''}>
                <SelectTrigger className="bg-white text-gray-900 border-0">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    {getCurrentRoom()?.name || "Select Room"}
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {availableRooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        {room.name} - {room.building} (Floor {room.floor})
                        <span className="text-sm text-gray-500">
                          ({room.type}, Capacity: {room.capacity})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="flex items-center gap-2"
                  disabled={isDeleting}
                >
                  <Trash2Icon size={16} />
                  {isDeleting ? 'Deleting...' : 'Delete Timetable'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete both the timetable and its associated class. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="overflow-x-auto">
          <Table className="border-collapse w-full">
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-700">Day / Period</TableHead>
                {Array.from({ length: PERIODS_PER_DAY }, (_, i) => (
                  <TableHead key={i} className="font-semibold text-gray-700 text-center">
                    {i + 1}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {DAYS.map((day) => (
                <TableRow key={day} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="font-medium text-gray-700">{day}</TableCell>
                  {Array.from({ length: PERIODS_PER_DAY }, (_, period) => {
                    const slot = getSlot(day, period);
                    if (slot?.is_interval) {
                      return (
                        <TableCell key={period} className="bg-gray-100 text-center text-sm text-gray-500">
                          Break Time
                        </TableCell>
                      );
                    }
                    return (
                      <TableCell key={period} className="p-2">
                        <div className="space-y-2">
                          <Select
                            value={slot?.subject_id || "none"}
                            onValueChange={(value) => handleSlotChange(day, period, value === "none" ? null : value, slot?.is_lab || false)}
                          >
                            <SelectTrigger className="w-full bg-white border border-gray-200 hover:border-blue-500 transition-colors">
                              <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Empty</SelectItem>
                              {subjects.map((subject) => (
                                <SelectItem key={subject.id} value={subject.id}>
                                  {subject.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleSlotChange(day, period, slot?.subject_id || null, !slot?.is_lab)}
                              variant="outline"
                              size="sm"
                              className={`flex items-center gap-1 ${
                                slot?.is_lab ? 'bg-purple-100 text-purple-700' : 'bg-white text-gray-700'
                              }`}
                            >
                              <BeakerIcon size={14} />
                              {slot?.is_lab ? 'Lab' : 'Set Lab'}
                            </Button>
                            <Button
                              onClick={() => removeSlot(day, period)}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1 text-red-600 hover:bg-red-50"
                            >
                              <XCircleIcon size={14} />
                              Clear
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>        
        </div>
        <div className="mt-6 flex gap-4">
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 flex items-center gap-2"
          >
            <Save size={16} />
            Save Changes
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <X size={16} />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}