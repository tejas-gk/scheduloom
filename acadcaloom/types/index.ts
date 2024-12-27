export interface Subject {
  id: string;
  name: string;
  color: string;
  teacherId: string;
  constraints?: {
    [day: string]: { start: number; end: number } | null;
  };
}

export interface Teacher {
  id: string;
  name: string;
  constraints: {
    [day: string]: { start: number; end: number } | null;
  };
}

export interface Class {
  id: string;
  name: string;
  subjects: string[];
  labs: { subject_id: string; duration: number }[];
  room_id: string; 
  user_id: string;
  created_at?: string;
}
export interface Room {
  id: string;
  name: string;
  capacity: number;
  type: 'classroom' | 'lab' | 'lecture_hall';
  building: string;
  floor: number;
  availability?: {
    [day: string]: { start: number; end: number } | null;
  };
}

// Update TimeSlot interface
export interface TimeSlot {
  day: string;
  period: number;
  subject_id: string | null;
  room_id: string | null; // Add room allocation
  is_lab: boolean;
  is_interval?: boolean;
}

export interface Timetable {
  classId: string;
  slots: TimeSlot[];
}

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
export const PERIODS_PER_DAY = 8;
export const LAB_DURATION = 2; // New constant for lab duration

