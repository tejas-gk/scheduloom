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
  labs: { subjectId: string; duration: number }[];
}

export interface TimeSlot {
  day: string;
  period: number;
  subjectId: string | null;
  isLab: boolean;
}

export interface Timetable {
  classId: string;
  slots: TimeSlot[];
}

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
export const PERIODS_PER_DAY = 8;

