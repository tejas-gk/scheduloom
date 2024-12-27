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
import SubjectForm from './SubjectForm';
import TeacherForm from './TeacherForm';
import ClassForm from './ClassForm';
import RoomForm from './RoomForm';
import TimetableView from './TimetableView';
import TimetableEditForm from './TimetableEditForm';
import { Calendar, User, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { dataService } from '@/services/dataService';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';


export default function TimetableGenerator({ session, userData, setUserData }: TimetableGeneratorProps) {
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
  const [editingSlot, setEditingSlot] = useState<{ class_id: string; day: string; period: number } | null>(null);
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

  const addTeacher = async (teacher: Omit<Teacher, 'id'>) => {
    try {
      const newTeacher = {
        ...teacher,
        user_id: session?.user?.id
      };
      
      const createdTeacher = await dataService.createTeacher(newTeacher);
      setTeachers(prev => [...prev, createdTeacher]);
      
      toast({
        title: "Success",
        description: "Teacher added successfully",
      });
    } catch (error) {
      console.error('Error adding teacher:', error);
      toast({
        title: "Error",
        description: "Failed to add teacher",
        variant: "destructive"
      });
    }
  };

  const addClass = async (classData: Omit<Class, 'id'>) => {
    try {
      // Check if a class with the same name already exists
      const existingClass = classes.find(
        cls => cls.name.toLowerCase() === classData.name.toLowerCase()
      );
      
      if (existingClass) {
        toast({
          title: "Error",
          description: `A class with the name "${classData.name}" already exists`,
          variant: "destructive"
        });
        return;
      }
  
      const newClass = {
        ...classData,
        user_id: session?.user?.id,
        labs: classData.labs || [], // Ensure labs is initialized
        subjects: classData.subjects || [], // Ensure subjects is initialized
      };
      
      const createdClass = await dataService.createClass(newClass);
      setClasses(prev => [...prev, createdClass]);
      
      toast({
        title: "Success",
        description: "Class added successfully",
      });
    } catch (error) {
      console.error('Error adding class:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add class",
        variant: "destructive"
      });
    }
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
        { 
          id: 'subject_1', 
          name: 'Mathematics', 
          color: '#FF5733', 
          teacher_id: 'teacher_1',
          user_id: 'current_user_id', // Required by database
          constraints: { 
            'Monday': { start: 1, end: 4 } 
          },
          created_at: new Date().toISOString()
        },
        { 
          id: 'subject_2', 
          name: 'Physics', 
          color: '#33FF57', 
          teacher_id: 'teacher_2',
          user_id: 'current_user_id', // Required by database
          constraints: { 
            'Tuesday': { start: 5, end: 8 } 
          },
          created_at: new Date().toISOString()
        },
      ],
      teachers: [
        { 
          id: 'teacher_1', 
          name: 'John Doe',
          user_id: 'current_user_id', // Required by database
          constraints: { 
            'Monday': { start: 1, end: 6 } 
          },
          created_at: new Date().toISOString()
        },
        { 
          id: 'teacher_2', 
          name: 'Jane Smith',
          user_id: 'current_user_id', // Required by database
          constraints: { 
            'Tuesday': { start: 3, end: 8 } 
          },
          created_at: new Date().toISOString()
        },
      ],
      classes: [
        { 
          id: 'class_1', 
          name: 'Class 10A',
          user_id: 'current_user_id', // Required by database
          subjects: ['subject_1', 'subject_2'],
          labs: [], // Should be JSONB in database
          created_at: new Date().toISOString()
        },
      ],
      timetables: [
        {
          id: 'timetable_1',
          class_id: 'class_1',
          user_id: 'current_user_id', // Required by database
          slots: DAYS.flatMap(day =>
            Array.from({ length: PERIODS_PER_DAY + 2 }, (_, period) => {
              // Add intervals at period 2 and 4
              if (period === 2 || period === 4) {
                return {
                  day,
                  period,
                  subject_id: null,
                  is_lab: false,
                  is_interval: true
                };
              }
              // Adjust period numbers for normal slots
              const adjustedPeriod = period < 2 ? period : period < 4 ? period - 1 : period - 2;
              return {
                day,
                period: adjustedPeriod,
                subject_id: Math.random() > 0.5 ? 'subject_1' : 'subject_2',
                is_lab: false,
                is_interval: false
              };
            })
          ),
          created_at: new Date().toISOString()
        },
      ],
    };
  
    // Replace 'current_user_id' with actual session user ID
    const userJson = JSON.stringify(sampleData, null, 2).replace(
      /current_user_id/g, 
      session?.user?.id || ''
    );
    
    setBulkUploadData(userJson);
  };

  const startEditingTimetable = (timetable: Timetable) => {
    setEditingTimetable(timetable);
  };

  const saveEditedTimetable = (editedTimetable: Timetable) => {
    setTimetables(timetables.map(t => t.class_id === editedTimetable.class_id ? editedTimetable : t));
    setEditingTimetable(null);
  };

  const removeSlot = (class_id: string, day: string, period: number) => {
    setTimetables(timetables.map(timetable => {
      if (timetable.class_id === class_id) {
        return {
          ...timetable,
          slots: timetable.slots.map(slot => {
            if (slot.day === day && slot.period === period) {
              return { ...slot, subject_id: null, isLab: false };
            }
            return slot;
          })
        };
      }
      return timetable;
    }));
  };

  const editSlot = (class_id: string, day: string, period: number) => {
    setEditingSlot({ class_id, day, period });
  };

  const saveEditedSlot = (subject_id: string) => {
    if (editingSlot) {
      setTimetables(timetables.map(timetable => {
        if (timetable.class_id === editingSlot.class_id) {
          return {
            ...timetable,
            slots: timetable.slots.map(slot => {
              if (slot.day === editingSlot.day && slot.period === editingSlot.period) {
                return { ...slot, subject_id, isLab: false };
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

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Bulk Upload</h2>
          <Textarea
            value={bulkUploadData}
            onChange={(e) => setBulkUploadData(e.target.value)}
            placeholder="Paste JSON data here"
            className="mb-4 min-h-[200px] border-gray-200 focus:border-purple-500 focus:ring-purple-500"
          />
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleBulkUpload} className="bg-purple-600 hover:bg-purple-700">
              Upload JSON
            </Button>
            <Button onClick={getSampleData} variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
              Get Sample Data
            </Button>
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              variant="outline"
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              Upload Excel
            </Button>
          </div>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".xlsx, .xls"
          style={{ display: 'none' }}
        />
      </div>
      <Card className="w-full max-w-6xl mx-auto bg-white shadow-lg mb-6">
      <CardContent className="pt-6 pb-6">
        <div className="space-y-6">
          {/* Generate Button */}
          <Button 
            onClick={generateTimetablesHandler}
            className="w-auto bg-indigo-500 hover:bg-indigo-600 text-white font-medium flex items-center justify-center gap-2"
            size="lg"
          >
            <Calendar className="w-5 h-5" />
            Generate Timetables
          </Button>

          {/* View Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              View Type
            </Label>
            <Select onValueChange={(value: 'teacher' | 'student') => setSelectedView(value)}>
              <SelectTrigger 
                id="viewSelect"
                className="w-full border-gray-200 focus:border-indigo-500"
              >
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Student View
                  </div>
                </SelectItem>
                <SelectItem value="teacher">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Teacher View
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Class Selection - Only shown for student view */}
          {selectedView === 'student' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                Select Class
              </Label>
              <Select onValueChange={(value: string) => setSelectedClass(value)}>
                <SelectTrigger 
                  id="classSelect"
                  className="w-full border-gray-200 focus:border-indigo-500"
                >
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {cls.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    {timetables.length > 0 && (
        <div className="mb-4">
          <TimetableView
            timetables={selectedView === 'student' && selectedClass ? [timetables.find((t) => t.class_id === selectedClass)!] : timetables}
            subjects={subjects}
            teachers={teachers}
            classes={classes}
            rooms={rooms} 
            view={selectedView}
            onRemoveSlot={removeSlot}
            onEditSlot={editSlot}
            onRemoveTimetable={(class_id) => setTimetables(timetables.filter(t => t.class_id !== class_id))}
          />
          {selectedView === 'student' && selectedClass && (
            <div className="left-4 mt-4">
              <Button onClick={() => startEditingTimetable(timetables.find((t) => t.class_id === selectedClass)!)} className="mr-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
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
          teachers={teachers}
          classes={classes}
          rooms={rooms}
          onSave={saveEditedTimetable}
          onCancel={() => setEditingTimetable(null)}
          onDelete={(timetableId) => {
            setTimetables(timetables.filter(t => t.id !== timetableId));
            setEditingTimetable(null);
          }}
        />
      )}
      {editingSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Edit Slot</h3>
            <Select onValueChange={saveEditedSlot}>
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setEditingSlot(null)} className="mt-2">Cancel</Button>
          </div>
        </div>
      )}
      <Toaster />
    </div>
  );
}

interface TimetableGeneratorProps {
  session?: any;
  userData?: any;
  setUserData?: (data: any) => void;
}
