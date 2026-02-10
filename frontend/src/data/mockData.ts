import { Department, Student, AttendanceSession } from '@/types/attendance';

export const departments: Department[] = [
  { id: '1', name: 'Information Technology', code: 'IT' },
  { id: '2', name: 'Computer Science', code: 'CSE' },
  { id: '3', name: 'Electronics & Communication', code: 'ECE' },
  { id: '4', name: 'Mechanical Engineering', code: 'MECH' },
  { id: '5', name: 'Civil Engineering', code: 'CIVIL' },
];

export const years = [
  { value: 1, label: 'First Year' },
  { value: 2, label: 'Second Year' },
  { value: 3, label: 'Third Year' },
  { value: 4, label: 'Fourth Year' },
];

export const sections = ['A', 'B', 'C', 'D'];

export const semesters = [
  { value: 1, label: 'Semester 1', year: 1 },
  { value: 2, label: 'Semester 2', year: 1 },
  { value: 3, label: 'Semester 3', year: 2 },
  { value: 4, label: 'Semester 4', year: 2 },
  { value: 5, label: 'Semester 5', year: 3 },
  { value: 6, label: 'Semester 6', year: 3 },
  { value: 7, label: 'Semester 7', year: 4 },
  { value: 8, label: 'Semester 8', year: 4 },
];

// Helper function to get semesters for a specific year
export const getSemestersForYear = (year: number) => {
  return semesters.filter(s => s.year === year);
};

export const subjects = [
  'Data Structures',
  'Database Management',
  'Web Development',
  'Operating Systems',
  'Computer Networks',
  'Software Engineering',
  'Machine Learning',
  'Cloud Computing',
];

export const generateStudents = (departmentId: string, year: number, section: string): Student[] => {
  return [];
};

export const recentSessions: AttendanceSession[] = [];
