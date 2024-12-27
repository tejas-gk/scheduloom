// services/dataService.ts
import { supabase } from '@/utils/supabaseClient';
import { Subject, Teacher, Class, Timetable, Room } from '../types';

export const dataService = {
  // Subjects
  async getSubjects() {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async createSubject(subject: Omit<Subject, 'id'>) {
    const { data, error } = await supabase
      .from('subjects')
      .insert([{ ...subject }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateSubject(id: string, updates: Partial<Subject>) {
    const { data, error } = await supabase
      .from('subjects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteSubject(id: string) {
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Teachers
  async getTeachers() {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async createTeacher(teacher: Omit<Teacher, 'id'>) {
    const { data, error } = await supabase
      .from('teachers')
      .insert([{ ...teacher }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateTeacher(id: string, updates: Partial<Teacher>) {
    const { data, error } = await supabase
      .from('teachers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteTeacher(id: string) {
    const { error } = await supabase
      .from('teachers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Classes
  async getClasses() {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async createClass(classData: Omit<Class, 'id'>) {
    // Check if the room is already allocated
    const { data: existingClasses } = await supabase
      .from('classes')
      .select('room_id');
    
    const roomAlreadyAllocated = existingClasses?.some(
      cls => cls.room_id === classData.room_id
    );

    if (roomAlreadyAllocated) {
      throw new Error('Selected room is already allocated to another class');
    }

    const { data, error } = await supabase
      .from('classes')
      .insert([{
        name: classData.name,
        subjects: classData.subjects,
        labs: classData.labs || [],
        room_id: classData.room_id,
        user_id: classData.user_id
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    return data;
  },

  async updateClass(id: string, updates: Partial<Class>) {
    const { data, error } = await supabase
      .from('classes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteClass(id: string) {
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Timetables
  async getTimetables() {
    const { data, error } = await supabase
      .from('timetables')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async createTimetable(timetable: Omit<Timetable, 'id'>) {
    const { data, error } = await supabase
      .from('timetables')
      .insert([{ ...timetable }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateTimetable(id: string, updates: Partial<Timetable>) {
    const { data, error } = await supabase
      .from('timetables')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteTimetable(id: string) {
    const { error } = await supabase
      .from('timetables')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async getRooms() {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async createRoom(room: Omit<Room, 'id'>) {
    const { data, error } = await supabase
      .from('rooms')
      .insert([{ ...room }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateRoom(id: string, updates: Partial<Room>) {
    const { data, error } = await supabase
      .from('rooms')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteRoom(id: string) {
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};