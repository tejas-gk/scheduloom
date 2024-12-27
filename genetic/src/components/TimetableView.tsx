import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Timetable, Subject, Teacher, Class, DAYS, PERIODS_PER_DAY } from '../types';

interface TimetableViewProps {
  timetables: Timetable[];
  subjects: Subject[];
  teachers: Teacher[];
  classes: Class[];
  view: 'student' | 'teacher';
}

export default function TimetableView({ timetables, subjects, teachers, classes, view }: TimetableViewProps) {
  const getSubjectName = (subjectId: string | null) => {
    if (!subjectId) return '';
    const subject = subjects.find((s) => s.id === subjectId);
    return subject ? subject.name : '';
  };

  const getClassName = (classId: string) => {
    const classData = classes.find((c) => c.id === classId);
    return classData ? classData.name : '';
  };

  const getTeacherSchedule = (teacherId: string) => {
    const schedule: { [key: string]: { className: string; subjectName: string }[] } = {};
    DAYS.forEach(day => {
      schedule[day] = Array(PERIODS_PER_DAY).fill(null);
    });

    timetables.forEach(timetable => {
      timetable.slots.forEach(slot => {
        const subject = subjects.find(s => s.id === slot.subjectId);
        if (subject && subject.teacherId === teacherId) {
          schedule[slot.day][slot.period] = {
            className: getClassName(timetable.classId),
            subjectName: subject.name,
          };
        }
      });
    });

    return schedule;
  };

  if (view === 'teacher') {
    return (
      <div>
        {teachers.map(teacher => (
          <div key={teacher.id} className="mb-8">
            <h2 className="text-2xl font-bold mb-4">{teacher.name}'s Schedule</h2>
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
                      const schedule = getTeacherSchedule(teacher.id);
                      const slot = schedule[day][period];
                      return (
                        <TableCell key={period}>
                          {slot ? `${slot.className} - ${slot.subjectName}` : ''}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {timetables.map(timetable => (
        <div key={timetable.classId} className="mb-8">
          <h2 className="text-2xl font-bold mb-4">{getClassName(timetable.classId)} Timetable</h2>
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
                    const slot = timetable.slots.find((s) => s.day === day && s.period === period);
                    return (
                      <TableCell
                        key={period}
                        style={{ backgroundColor: slot?.subjectId ? subjects.find(s => s.id === slot.subjectId)?.color : '' }}
                      >
                        {slot ? getSubjectName(slot.subjectId) : ''}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
}

