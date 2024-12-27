'use client'
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Subject, Teacher, Class, Timetable, Room, DAYS, PERIODS_PER_DAY } from '../types';
import { generateRandomColor } from '../utils/colorGenerator';
import { generateTimetables } from '../utils/geneticAlgorithm';
import { parseExcelFile } from '../utils/excelParser';
import { exportTimetableToExcel } from '@/utils/timetableExport';
import { downloadTimetableAsPng } from '@/utils/downloadTimetableAsPng';
import SubjectForm from './SubjectForm';
import TeacherForm from './TeacherForm';
import ClassForm from './ClassForm';
import RoomForm from './RoomForm';
import TimetableView from './TimetableView';
import TimetableEditForm from './TimetableEditForm';

export default function TimetableGenerator() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [timetables, setTimetables] = useState<Timetable[]>([]);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedView, setSelectedView] = useState<'teacher' | 'student'>('student');
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [bulkUploadData, setBulkUploadData] = useState('');
  const [editingTimetable, setEditingTimetable] = useState<Timetable | null>(null);
  const [editingSlot, setEditingSlot] = useState<{ classId: string; day: string; period: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadInitialData();
  }, [session?.user?.id]);

  const loadInitialData = async () => {
    if (!session?.user?.id) return;
    
    setLoading(true);
    try {
      const [loadedSubjects, loadedTeachers, loadedClasses, loadedRooms, loadedTimetables] = await Promise.all([
        dataService.getSubjects(),
        dataService.getTeachers(),
        dataService.getClasses(),
        dataService.getRooms(),
        dataService.getTimetables()
      ]);
      
      setSubjects(loadedSubjects);
      setTeachers(loadedTeachers);
      setClasses(loadedClasses);
      setRooms(loadedRooms);
      setTimetables(loadedTimetables);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const addSubject = async (subject: Omit<Subject, 'id' | 'color'>) => {
    try {
      const newSubject = {
        ...subject,
        teacher_id: subject.teacher_id, // Use snake_case to match database
        color: generateRandomColor(),
        user_id: session?.user?.id
      };
      
      const createdSubject = await dataService.createSubject(newSubject);
      setSubjects(prev => [...prev, createdSubject]);
      
      toast({
        title: "Success",
        description: "Subject added successfully",
      });
    } catch (error) {
      console.error('Error adding subject:', error);
      toast({
        title: "Error",
        description: "Failed to add subject",
        variant: "destructive"
      });
    }
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

  const addRoom = async (room: Omit<Room, 'id'>) => {
    try {
      const newRoom = {
        ...room,
        user_id: session?.user?.id
      };
      
      const createdRoom = await dataService.createRoom(newRoom);
      setRooms(prev => [...prev, createdRoom]);
      
      toast({
        title: "Success",
        description: "Room added successfully",
      });
    } catch (error) {
      console.error('Error adding room:', error);
      toast({
        title: "Error",
        description: "Failed to add room",
        variant: "destructive"
      });
    }
  };

  const generateTimetablesHandler = async () => {
    try {
      setLoading(true);
      
      // Validate required data exists
      if (!classes || classes.length === 0) {
        throw new Error("No classes found. Please add at least one class before generating timetables.");
      }
      
      if (!teachers || teachers.length === 0) {
        throw new Error("No teachers found. Please add at least one teacher before generating timetables.");
      }
      
      if (!subjects || subjects.length === 0) {
        throw new Error("No subjects found. Please add at least one subject before generating timetables.");
      }
  
      // Get existing timetables for validation
      const existingTimetables = await dataService.getTimetables();
      const classesWithTimetables = new Set(existingTimetables.map(t => t.class_id));
  
      // Filter out classes that already have timetables
      const classesNeedingTimetables = classes.filter(cls => !classesWithTimetables.has(cls.id));
  
      if (classesNeedingTimetables.length === 0) {
        throw new Error("All classes already have timetables. Delete existing timetables first if you want to regenerate them.");
      }
  
      // Validate relationships between data
      for (const cls of classesNeedingTimetables) {
        if (!cls.subjects || cls.subjects.length === 0) {
          throw new Error(`Class ${cls.name} has no subjects assigned.`);
        }
        
        // Verify all subjects in class exist
        cls.subjects.forEach(subjectId => {
          if (!subjects.find(s => s.id === subjectId)) {
            throw new Error(`Invalid subject reference in class ${cls.name}`);
          }
        });
      }
  
      // Verify each subject has a teacher
      subjects.forEach(subject => {
        if (!subject.teacher_id || !teachers.find(t => t.id === subject.teacher_id)) {
          throw new Error(`Subject ${subject.name} has no valid teacher assigned.`);
        }
      });
  
      // Generate timetables only for classes that don't have one
      const generatedTimetables = generateTimetables(
        classesNeedingTimetables, 
        teachers, 
        subjects,
        rooms // Add this parameter
      );
      
      // Validate generated timetables
      if (!generatedTimetables || !Array.isArray(generatedTimetables)) {
        throw new Error("Failed to generate valid timetables structure");
      }
  
      // Validate each generated timetable
      generatedTimetables.forEach((timetable, index) => {
        if (!timetable || !timetable.class_id || !timetable.slots) {
          throw new Error(`Invalid timetable generated at index ${index}`);
        }
      });
  
      // Adjust the generated timetables to match database schema
      const adjustedTimetables = generatedTimetables.map(timetable => ({
        class_id: timetable.class_id,
        user_id: session?.user?.id,
        slots: DAYS.flatMap(day =>
          Array.from({ length: PERIODS_PER_DAY + 2 }, (_, period) => {
            if (period === 2 || period === 4) {
              return {
                day,
                period,
                subject_id: null,
                is_lab: false,
                is_interval: true
              };
            }
            const adjustedPeriod = period < 2 ? period : period < 4 ? period - 1 : period - 2;
            const slot = timetable.slots.find(s => s.day === day && s.period === adjustedPeriod);
            return slot
              ? {
                  day,
                  period,
                  subject_id: slot.subject_id,
                  is_lab: slot.is_lab,
                  is_interval: false
                }
              : {
                  day,
                  period,
                  subject_id: null,
                  is_lab: false,
                  is_interval: false
                };
          })
        ),
      }));
  
      // Save the generated timetables to the database
      const savedTimetables = await Promise.all(
        adjustedTimetables.map(timetable => dataService.createTimetable(timetable))
      );
  
      // Format timetables for frontend
      const formattedTimetables = savedTimetables.map(timetable => ({
        ...timetable,
        slots: timetable.slots.map(slot => ({
          ...slot,
          isLab: slot.is_lab,
          isInterval: slot.is_interval
        }))
      }));
  
      // Merge with existing timetables for display
      setTimetables(prevTimetables => [...prevTimetables, ...formattedTimetables]);
      
      toast({
        title: "Success",
        description: `Generated timetables for ${formattedTimetables.length} classes successfully`,
      });
  
    } catch (error) {
      console.error('Error generating timetables:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate timetables",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center bg-gradient-to-r from-purple-600 via-blue-600 to-emerald-600 bg-clip-text text-transparent">
          College Timetable Generator
        </h1>
        
        <div className="space-y-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <SubjectForm onSubmit={addSubject} teachers={teachers} />
            <TeacherForm onSubmit={addTeacher} />
            <RoomForm onSubmit={addRoom} />
          </div>
          
          <ClassForm 
            onSubmit={addClass} 
            subjects={subjects} 
            rooms={rooms}
            existingClasses={classes} // Pass existing classes to check room allocation
          />
      </div>


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
      </CardContent>
    </Card>
    {timetables.length > 0 && (
        <div className="mb-4">
          <TimetableView
            timetables={selectedView === 'student' && selectedClass
              ? [timetables.find((t) => t.classId === selectedClass)].filter(Boolean) as Timetable[]
              : timetables.filter(Boolean)}
            subjects={subjects}
            teachers={teachers}
            classes={classes}
            rooms={rooms} 
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
          teachers={teachers}
          classes={classes}
          rooms={rooms}
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

