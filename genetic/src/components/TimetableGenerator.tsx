import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Subject, Teacher, Class, Timetable, DAYS, PERIODS_PER_DAY } from '../types';
import { generateRandomColor } from '../utils/colorGenerator';
import { generateTimetables } from '../utils/geneticAlgorithm';
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

  const getSampleData = () => {
    const sampleData = {
      subjects: [
        { id: 'subject_1', name: 'Mathematics', color: '#FF5733', teacherId: 'teacher_1', constraints: { 'Monday': { start: 1, end: 4 } } },
        { id: 'subject_2', name: 'Physics', color: '#33FF57', teacherId: 'teacher_2', constraints: { 'Tuesday': { start: 5, end: 8 } } },
      ],
      teachers: [
        { id: 'teacher_1', name: 'John Doe', constraints: { 'Monday': { start: 1, end: 6 } } },
        { id: 'teacher_2', name: 'Jane Smith', constraints: { 'Tuesday': { start: 3, end: 8 } } },
      ],
      classes: [
        { id: 'class_1', name: 'Class 10A', subjects: ['subject_1', 'subject_2'], labs: [] },
      ],
      timetables: [
        {
          classId: 'class_1',
          slots: DAYS.flatMap(day =>
            Array.from({ length: PERIODS_PER_DAY }, (_, period) => ({
              day,
              period,
              subjectId: Math.random() > 0.5 ? 'subject_1' : 'subject_2',
              isLab: false,
            }))
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
        <Button onClick={handleBulkUpload} className="mr-2">Upload</Button>
        <Button onClick={getSampleData} variant="outline">Get Sample Data</Button>
      </div>
      <Button onClick={generateTimetablesHandler} className="mb-4">Generate Timetables</Button>
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
            timetables={selectedView === 'student' && selectedClass ? [timetables.find((t) => t.classId === selectedClass)!] : timetables}
            subjects={subjects}
            teachers={teachers}
            classes={classes}
            view={selectedView}
          />
          {selectedView === 'student' && selectedClass && (
            <div className="mt-4">
              <Button onClick={() => startEditingTimetable(timetables.find((t) => t.classId === selectedClass)!)} className="mr-2">
                Edit Timetable
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
    </div>
  );
}

