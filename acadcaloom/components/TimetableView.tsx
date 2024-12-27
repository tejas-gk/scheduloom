import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Timetable, Subject, Teacher, Class, Room, DAYS, PERIODS_PER_DAY } from '../types';
import { BeakerIcon, Building, GraduationCap, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TimetableViewProps {
  timetables: Timetable[];
  subjects: Subject[];
  teachers: Teacher[];
  classes: Class[];
  rooms: Room[];
  view: 'student' | 'teacher';
}

export default function TimetableView({
  timetables,
  subjects,
  teachers,
  classes,
  rooms,
  view,
}: TimetableViewProps) {
  const getSubjectName = (subject_id: string | null) => {
    if (!subject_id) return '';
    const subject = subjects.find((s) => s.id === subject_id);
    return subject ? subject.name : '';
  };

  const getClassName = (class_id: string) => {
    const classData = classes.find((c) => c.id === class_id);
    return classData ? classData.name : '';
  };

  const getRoomInfo = (room_id: string | null) => {
    if (!room_id) return null;
    const room = rooms.find((r) => r.id === room_id);
    return room ? {
      name: room.name,
      building: room.building,
      floor: room.floor,
      type: room.type,
      capacity: room.capacity
    } : null;
  };

  const getTeacherName = (subject_id: string | null) => {
    if (!subject_id) return '';
    const subject = subjects.find((s) => s.id === subject_id);
    if (!subject) return '';
    const teacher = teachers.find((t) => t.id === subject.teacher_id);
    return teacher ? teacher.name : '';
  };

  // Update getTeacherSchedule to include lab information
  const getTeacherSchedule = (teacher_id: string) => {
    const schedule: { [key: string]: { className: string; subjectName: string; roomInfo: any; is_lab: boolean }[] } = {};
    
    DAYS.forEach(day => {
      schedule[day] = Array(PERIODS_PER_DAY).fill(null);
    });
  
    timetables.forEach(timetable => {
      const classData = classes.find(c => c.id === timetable.class_id);
      if (!classData) return;

      timetable.slots.forEach(slot => {
        if (!slot.is_interval && slot.subject_id) {
          const subject = subjects.find(s => s.id === slot.subject_id);
          if (subject && subject.teacher_id === teacher_id) {
            schedule[slot.day][slot.period] = {
              className: classData.name,
              subjectName: subject.name,
              roomInfo: getRoomInfo(classData.room_id),
              is_lab: slot.is_lab
            };
          }
        }
      });
    });
  
    return schedule;
  };

  const getRoomTypeIcon = (type: string) => {
    switch (type) {
      case 'lab':
        return <BeakerIcon size={14} className="text-amber-500" />;
      case 'lecture_hall':
        return <Users size={14} className="text-blue-500" />;
      default:
        return <GraduationCap size={14} className="text-green-500" />;
    }
  };

  const renderRoomBadge = (roomInfo: any) => {
    if (!roomInfo) return null;
    
    return (
      <Badge variant="secondary" className="flex items-center gap-1 text-xs">
        <Building size={12} />
        {roomInfo.name}
        <span className="text-gray-500">•</span>
        {getRoomTypeIcon(roomInfo.type)}
        <span className="text-gray-500">•</span>
        <div className="flex items-center">
          <span>Floor {roomInfo.floor}</span>
        </div>
      </Badge>
    );
  };

  const renderCell = (slot: any, timetable: Timetable) => {
    if (!slot || slot.is_interval) return null;

    const subject = subjects.find(s => s.id === slot.subject_id);
    const classData = classes.find(c => c.id === timetable.class_id);
    const roomInfo = classData ? getRoomInfo(classData.room_id) : null;
    const teacherName = getTeacherName(slot.subject_id);

    return (
      <div className="p-2 space-y-2">
        {slot && !slot.is_interval && (
          <>
            <div className="space-y-1">
              <div className="font-medium text-gray-700 flex items-center gap-2">
                {getSubjectName(slot.subject_id)}
                {/* Add lab icon if is_lab is true */}
                {slot.is_lab && (
                  <BeakerIcon size={16} className="text-purple-600" />
                )}
              </div>
              <div className="text-sm text-gray-500">
                {teacherName}
              </div>
            </div>
            {roomInfo && (
              <div className="mt-1">
                {renderRoomBadge(roomInfo)}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // For teacher view, update the slot rendering to show lab status
  const renderTeacherSlot = (slot: any) => {
    if (!slot) return null;
    
    return (
      <div className="p-2 bg-indigo-50 rounded-lg space-y-2">
        <div className="font-medium text-indigo-700 flex items-center gap-2">
          {slot.className}
          {slot.is_lab && (
            <BeakerIcon size={16} className="text-purple-600" />
          )}
        </div>
        <div className="text-sm text-indigo-600">{slot.subjectName}</div>
        {slot.roomInfo && renderRoomBadge(slot.roomInfo)}
      </div>
    );
  };


  if (view === 'teacher') {
    return (
      <div className="space-y-8">
        {teachers.map(teacher => {
          const schedule = getTeacherSchedule(teacher.id);
          
          return (
            <Card key={teacher.id} className="bg-white shadow-lg rounded-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-6">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <GraduationCap className="h-6 w-6" />
                  {teacher.name}'s Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <Table>
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
                        <TableRow key={day} className="hover:bg-gray-50">
                          <TableCell className="font-medium text-gray-700">{day}</TableCell>
                          {Array.from({ length: PERIODS_PER_DAY }, (_, period) => {
                            const slot = schedule[day][period];
                            if (period === 2 || period === 4) {
                              return (
                                <TableCell key={period} className="bg-gray-100 text-center text-sm text-gray-500">
                                  Break Time
                                </TableCell>
                              );
                            }
                            return (
                              <TableCell key={period} className="text-center">
                                {slot && renderTeacherSlot(slot)}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {timetables.map(timetable => {
        const classData = classes.find(c => c.id === timetable.class_id);
        const roomInfo = classData ? getRoomInfo(classData.room_id) : null;
        
        return (
          <Card key={timetable.class_id} className="bg-white shadow-lg rounded-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
              <CardTitle className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-2xl">
                  <GraduationCap className="h-6 w-6" />
                  {getClassName(timetable.class_id)}
                </div>
                {roomInfo && (
                  <div className="text-sm flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="bg-white/20">
                      <div className="flex items-center gap-2">
                        <Building size={14} />
                        {roomInfo.name} • {roomInfo.building} • Floor {roomInfo.floor}
                        {getRoomTypeIcon(roomInfo.type)}
                        <span className="text-xs">({roomInfo.capacity} seats)</span>
                      </div>
                    </Badge>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <Table>
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
                      <TableRow key={day} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-gray-700">{day}</TableCell>
                        {Array.from({ length: PERIODS_PER_DAY }, (_, period) => {
                          if (period === 2 || period === 4) {
                            return (
                              <TableCell key={period} className="bg-gray-100 text-center text-sm text-gray-500">
                                Break Time
                              </TableCell>
                            );
                          }
                          const slot = timetable.slots.find((s) => s.day === day && s.period === period);
                          return (
                            <TableCell
                              key={period}
                              className="transition-all duration-200"
                              style={{ backgroundColor: slot?.subject_id ? `${subjects.find(s => s.id === slot.subject_id)?.color}20` : '' }}
                            >
                              {renderCell(slot, timetable)}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}