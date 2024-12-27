import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building } from 'lucide-react';
import { Room } from '../types';
import { DAYS, PERIODS_PER_DAY } from '../types';

interface RoomFormProps {
  onSubmit: (room: Omit<Room, 'id' | 'created_at'>) => Promise<void>;
}

export default function RoomForm({ onSubmit }: RoomFormProps) {
  const [name, setName] = React.useState('');
  const [building, setBuilding] = React.useState('');
  const [floor, setFloor] = React.useState('');
  const [capacity, setCapacity] = React.useState('');
  const [type, setType] = React.useState<'classroom' | 'lab' | 'lecture_hall'>('classroom');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create default availability object for all days and periods
    const availability = DAYS.reduce((acc, day) => {
      acc[day] = { start: 0, end: PERIODS_PER_DAY - 1 };
      return acc;
    }, {} as Record<string, { start: number; end: number } | null>);

    onSubmit({
      name,
      building,
      floor: parseInt(floor),
      capacity: parseInt(capacity),
      type,
      availability // Including the required availability field
    });

    // Reset form
    setName('');
    setBuilding('');
    setFloor('');
    setCapacity('');
    setType('classroom');
  };

  return (
    <Card className="w-full bg-gradient-to-br from-white to-gray-50 shadow-xl border-t-4 border-t-blue-500">
      <CardHeader className="border-b border-gray-100 bg-white/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100">
            <Building className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Add New Room
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="roomName" className="text-sm font-semibold text-gray-700">
              Room Name *
            </Label>
            <Input
              id="roomName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter room name"
              className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="building" className="text-sm font-semibold text-gray-700">
              Building *
            </Label>
            <Input
              id="building"
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
              placeholder="Enter building name"
              className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="floor" className="text-sm font-semibold text-gray-700">
                Floor *
              </Label>
              <Input
                id="floor"
                type="number"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                placeholder="Floor number"
                className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                required
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity" className="text-sm font-semibold text-gray-700">
                Capacity *
              </Label>
              <Input
                id="capacity"
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="Room capacity"
                className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                required
                min="1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type" className="text-sm font-semibold text-gray-700">
              Room Type *
            </Label>
            <Select 
              value={type} 
              onValueChange={(value: 'classroom' | 'lab' | 'lecture_hall') => setType(value)}
            >
              <SelectTrigger className="border-gray-200 focus:border-blue-500">
                <SelectValue placeholder="Select room type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="classroom">Classroom</SelectItem>
                <SelectItem value="lecture_hall">Lecture Hall</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Add Room
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}