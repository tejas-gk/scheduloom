import { Timetable, Subject, Teacher, Class, DAYS, PERIODS_PER_DAY } from '../types';
import * as XLSX from 'xlsx';

export function exportTimetableToExcel(timetables: Timetable[], subjects: Subject[], teachers: Teacher[], classes: Class[]) {
    const workbook = XLSX.utils.book_new();

    timetables.forEach((timetable) => {
        const classData = classes.find((c) => c.id === timetable.classId);
        const worksheet = XLSX.utils.aoa_to_sheet([
            ['', ...Array.from({ length: PERIODS_PER_DAY }, (_, i) => `Period ${i + 1}`)],
            ...DAYS.map(day => [
                day,
                ...Array.from({ length: PERIODS_PER_DAY }, (_, period) => {
                    const slot = timetable.slots.find(s => s.day === day && s.period === period);
                    if (!slot || !slot.subjectId) return '';
                    const subject = subjects.find(s => s.id === slot.subjectId);
                    const teacher = subject ? teachers.find(t => t.id === subject.teacherId) : null;
                    return `${subject?.name}${slot.isLab ? ' (Lab)' : ''}\n${teacher?.name || ''}`;
                })
            ])
        ]);

        XLSX.utils.book_append_sheet(workbook, worksheet, classData?.name || timetable.classId);
    });

    XLSX.writeFile(workbook, 'timetables.xlsx');
}

