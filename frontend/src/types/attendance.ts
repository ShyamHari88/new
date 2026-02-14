export type AttendanceStatus = 'present' | 'absent' | 'od';

export type Semester = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  semester: Semester;
  departmentId: string;
  year: number;
  teacherId: string;
  credits?: number;
  createdAt: string;
}

export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  email: string;
  departmentId: string;
  year: number;
  section: string;
  currentSemester: Semester;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
  subject: string;
  teacherId: string;
  period: string; // Added period
  timestamp: string;
}

export interface ClassInfo {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  year: number;
  section: string;
}

export interface AttendanceSession {
  id: string;
  classInfo: ClassInfo;
  date: string;
  subject: string;
  period: string; // Added period
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  odCount: number;
  topicCovered?: string;
  canEdit?: boolean;
}

export interface StudentAttendanceSummary {
  student: Student;
  totalClasses: number;
  present: number;
  absent: number;
  od: number;
  percentage: number;
}

export type AssessmentType = 'CIA_T1' | 'CIA_T2' | 'CIA_T3' | 'SEMESTER';

export interface SubjectMark {
  id: string;
  studentId: string;
  subject: string;
  subjectName?: string;
  assessmentType: AssessmentType;
  marks: number;
  maxMarks: number;
  date: string;
  uploadedBy: string; // teacher id
  timestamp: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
}
