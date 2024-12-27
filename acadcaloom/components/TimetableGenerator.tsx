import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Subject, Teacher, Class, Timetable, DAYS, PERIODS_PER_DAY } from '../types';
import { generateRandomColor } from '../utils/colorGenerator';
import { generateTimetables } from '../utils/geneticAlgorithm';
import { parseExcelFile } from '../utils/excelParser';
import { exportTimetableToExcel } from '@/utils/timetableExport';
import { downloadTimetableAsPng } from '@/utils/downloadTimetableAsPng';
import SubjectForm from './SubjectForm';
import TeacherForm from './TeacherForm';
import ClassForm from './ClassForm';
import TimetableView from './TimetableView';
import TimetableEditForm from './TimetableEditForm';

export default function TimetableGenerator() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [selectedView, setSelectedView] = useState<'teacher' | 'student'>('student');
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [bulkUploadData, setBulkUploadData] = useState('');
  const [editingTimetable, setEditingTimetable] = useState<Timetable | null>(null);
  const [editingSlot, setEditingSlot] = useState<{ classId: string; day: string; period: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addSubject = (subject: Omit<Subject, 'id' | 'color'>) => {
    const newSubject: Subject = {
      ...subject,
      id: `subject_${subjects.length + 1}`,
      color: generateRandomColor(),
    };
    setSubjects([...subjects, newSubject]);
  };

  const addTeacher = (teacher: Omit<Teacher, 'id'>) => {
    const newTeacher: Teacher = {
      ...teacher,
      id: `teacher_${teachers.length + 1}`,
    };
    setTeachers([...teachers, newTeacher]);
  };

  const addClass = (classData: Omit<Class, 'id'>) => {
    const newClass: Class = {
      ...classData,
      id: `class_${classes.length + 1}`,
    };
    setClasses([...classes, newClass]);
  };

  const generateTimetablesHandler = () => {
    const generatedTimetables = generateTimetables(classes, teachers, subjects);
    setTimetables(generatedTimetables);
  };

  const handleBulkUpload = () => {
    try {
      const data = JSON.parse(bulkUploadData);
      if (data.subjects) setSubjects(data.subjects);
      if (data.teachers) setTeachers(data.teachers);
      if (data.classes) setClasses(data.classes);
      if (data.timetables) setTimetables(data.timetables);
      setBulkUploadData('');
    } catch (error) {
      console.error('Error parsing bulk upload data:', error);
      alert('Invalid JSON format. Please check your input and try again.');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const { subjects, teachers, classes, timetables } = await parseExcelFile(file);
        setSubjects(subjects);
        setTeachers(teachers);
        setClasses(classes);
        setTimetables(timetables);
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        alert('Error parsing Excel file. Please check the file format and try again.');
      }
    }
  };

  const getSampleData = () => {
    const sampleData = {
      subjects: [
        { id: 'subject_1', name: 'Mathematics', color: '#FF5733', teacherId: 'teacher_1', constraints: { 'Monday': { start: 1, end: 6 } } },
        { id: 'subject_2', name: 'Physics', color: '#33FF57', teacherId: 'teacher_2', constraints: { 'Tuesday': { start: 1, end: 6 } } },
        { id: 'subject_3', name: 'Chemistry', color: '#3357FF', teacherId: 'teacher_3', constraints: { 'Wednesday': { start: 1, end: 6 } } },
        { id: 'subject_4', name: 'Biology', color: '#FF33F1', teacherId: 'teacher_4', constraints: { 'Thursday': { start: 1, end: 6 } } },
        { id: 'subject_5', name: 'Computer Science', color: '#33FFF1', teacherId: 'teacher_5', constraints: { 'Friday': { start: 1, end: 6 } } },
      ],
      teachers: [
        { id: 'teacher_1', name: 'John Doe', constraints: { 'Monday': { start: 1, end: 6 }, 'Wednesday': { start: 1, end: 6 } } },
        { id: 'teacher_2', name: 'Jane Smith', constraints: { 'Tuesday': { start: 1, end: 6 }, 'Thursday': { start: 1, end: 6 } } },
        { id: 'teacher_3', name: 'Bob Johnson', constraints: { 'Wednesday': { start: 1, end: 6 }, 'Friday': { start: 1, end: 6 } } },
        { id: 'teacher_4', name: 'Alice Brown', constraints: { 'Monday': { start: 1, end: 6 }, 'Thursday': { start: 1, end: 6 } } },
        { id: 'teacher_5', name: 'Charlie Wilson', constraints: { 'Tuesday': { start: 1, end: 6 }, 'Friday': { start: 1, end: 6 } } },
      ],
      classes: [
        { id: 'class_1', name: 'Class 10A', subjects: ['subject_1', 'subject_2', 'subject_3', 'subject_4', 'subject_5'], labs: ['subject_2', 'subject_3', 'subject_4'] },
        { id: 'class_2', name: 'Class 10B', subjects: ['subject_1', 'subject_2', 'subject_3', 'subject_4', 'subject_5'], labs: ['subject_2', 'subject_3', 'subject_4'] },
      ],
      timetables: [
        {
          classId: 'class_1',
          slots: DAYS.flatMap(day =>
            Array.from({ length: PERIODS_PER_DAY + 2 }, (_, period) => {
              if (period === 2 || period === 5) {
                return { day, period, subjectId: null, isLab: false, isInterval: true };
              }
              const adjustedPeriod = period > 5 ? period - 2 : period > 2 ? period - 1 : period;
              return {
                day,
                period,
                subjectId: `subject_${(adjustedPeriod % 5) + 1}`,
                isLab: adjustedPeriod === 0 || adjustedPeriod === 2 || adjustedPeriod === 4 || adjustedPeriod === 6,
                isInterval: false,
              };
            })
          ),
        },
        {
          classId: 'class_2',
          slots: DAYS.flatMap(day =>
            Array.from({ length: PERIODS_PER_DAY + 2 }, (_, period) => {
              if (period === 2 || period === 5) {
                return { day, period, subjectId: null, isLab: false, isInterval: true };
              }
              const adjustedPeriod = period > 5 ? period - 2 : period > 2 ? period - 1 : period;
              return {
                day,
                period,
                subjectId: `subject_${((adjustedPeriod + 2) % 5) + 1}`,
                isLab: adjustedPeriod === 0 || adjustedPeriod === 2 || adjustedPeriod === 4 || adjustedPeriod === 6,
                isInterval: false,
              };
            })
          ),
        },
      ],
    };
    setBulkUploadData(JSON.stringify(sampleData, null, 2));
  };

  const startEditingTimetable = (timetable: Timetable) => {
    setEditingTimetable(timetable);
  };

  const saveEditedTimetable = (editedTimetable: Timetable) => {
    setTimetables(timetables.map(t => t.classId === editedTimetable.classId ? editedTimetable : t));
    setEditingTimetable(null);
  };

  const removeSlot = (classId: string, day: string, period: number) => {
    setTimetables(timetables.map(timetable => {
      if (timetable.classId === classId) {
        return {
          ...timetable,
          slots: timetable.slots.map(slot => {
            if (slot.day === day && slot.period === period) {
              return { ...slot, subjectId: null, isLab: false };
            }
            return slot;
          })
        };
      }
      return timetable;
    }));
  };

  const editSlot = (classId: string, day: string, period: number) => {
    setEditingSlot({ classId, day, period });
  };

  const saveEditedSlot = (subjectId: string, isLab: boolean) => {
    if (editingSlot) {
      setTimetables(timetables.map(timetable => {
        if (timetable.classId === editingSlot.classId) {
          return {
            ...timetable,
            slots: timetable.slots.map(slot => {
              if (slot.day === editingSlot.day && slot.period === editingSlot.period) {
                return { ...slot, subjectId, isLab };
              }
              return slot;
            })
          };
        }
        return timetable;
      }));
      setEditingSlot(null);
    }
  };

  const handleDownloadPng = () => {
    if (selectedClass) {
      const selectedTimetable = timetables.find(t => t.classId === selectedClass);
      if (selectedTimetable) {
        const className = classes.find(c => c.id === selectedClass)?.name || 'Unknown';
        downloadTimetableAsPng(`timetable-${selectedTimetable.classId}`, className);
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">College Timetable Generator</h1>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <SubjectForm onSubmit={addSubject} teachers={teachers} />
        <TeacherForm onSubmit={addTeacher} />
        <ClassForm onSubmit={addClass} subjects={subjects} />
      </div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Bulk Upload</h2>
        <Textarea
          value={bulkUploadData}
          onChange={(e) => setBulkUploadData(e.target.value)}
          placeholder="Paste JSON data here"
          className="mb-2"
        />
        <Button onClick={handleBulkUpload} className="mr-2">Upload JSON</Button>
        <Button onClick={getSampleData} variant="outline" className="mr-2">Get Sample Data</Button>
        <Button onClick={() => fileInputRef.current?.click()} variant="outline">
          Upload Excel
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".xlsx, .xls"
          style={{ display: 'none' }}
        />
      </div>
      <Button onClick={generateTimetablesHandler} className="mb-4 mr-2">Generate Timetables</Button>
      <Button onClick={() => exportTimetableToExcel(timetables, subjects, teachers, classes)} className="mb-4" disabled={timetables.length === 0}>
        Download Timetables
      </Button>
      <div className="mb-4">
        <Label htmlFor="viewSelect">View</Label>
        <Select onValueChange={(value: 'teacher' | 'student') => setSelectedView(value)}>
          <SelectTrigger id="viewSelect">
            <SelectValue placeholder="Select view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="student">Student View</SelectItem>
            <SelectItem value="teacher">Teacher View</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {selectedView === 'student' && (
        <div className="mb-4">
          <Label htmlFor="classSelect">Class</Label>
          <Select onValueChange={(value: string) => setSelectedClass(value)}>
            <SelectTrigger id="classSelect">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {timetables.length > 0 && (
        <div className="mb-4">
          <TimetableView
            timetables={selectedView === 'student' && selectedClass
              ? [timetables.find((t) => t.classId === selectedClass)].filter(Boolean) as Timetable[]
              : timetables.filter(Boolean)}
            subjects={subjects}
            teachers={teachers}
            classes={classes}
            view={selectedView}
            onRemoveSlot={removeSlot}
            onEditSlot={editSlot}
          />
          {selectedView === 'student' && selectedClass && (
            <div className="mt-4">
              <Button onClick={() => startEditingTimetable(timetables.find((t) => t.classId === selectedClass)!)} className="mr-2">
                Edit Timetable
              </Button>
              <Button onClick={handleDownloadPng} className="mr-2">
                Download as PNG
              </Button>
            </div>
          )}
        </div>
      )}
      {editingTimetable && (
        <TimetableEditForm
          timetable={editingTimetable}
          subjects={subjects}
          onSave={saveEditedTimetable}
          onCancel={() => setEditingTimetable(null)}
        />
      )}
      {editingSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Edit Slot</h3>
            <Select onValueChange={(value) => {
              const [subjectId, isLab] = value.split('|');
              saveEditedSlot(subjectId, isLab === 'true');
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <React.Fragment key={subject.id}>
                    <SelectItem value={`${subject.id}|false`}>
                      {subject.name}
                    </SelectItem>
                    <SelectItem value={`${subject.id}|true`}>
                      {subject.name} (Lab)
                    </SelectItem>
                  </React.Fragment>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setEditingSlot(null)} className="mt-2">Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}

