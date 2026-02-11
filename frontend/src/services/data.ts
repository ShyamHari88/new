import { Student, AttendanceRecord, AttendanceSession, Department, SubjectMark, AssessmentType, UserProfile, Subject, Semester } from '@/types/attendance';
import { generateStudents, departments, years, sections } from '@/data/mockData';

const STUDENTS_KEY = 'attendease_students';
const RECORDS_KEY = 'attendease_attendance_records';
const SESSIONS_KEY = 'attendease_attendance_sessions'; // For session history if needed
const MARKS_KEY = 'attendease_marks';
const USER_PROFILE_KEY = 'attendease_user_profile';
const SUBJECTS_KEY = 'attendease_subjects';

// Initialize data if not present
const initializeData = () => {
    if (!localStorage.getItem(STUDENTS_KEY)) {
        // Initialize with sample student so login works for testing
        const sampleStudent: Student = {
            id: 'sample-student-1',
            name: 'Tamil',
            rollNumber: '23IT151',
            email: 'tamil@college.edu',
            departmentId: '1', // IT
            year: 1,
            section: 'C',
            currentSemester: 1
        };
        localStorage.setItem(STUDENTS_KEY, JSON.stringify([sampleStudent]));
    }

    if (!localStorage.getItem(RECORDS_KEY)) {
        localStorage.setItem(RECORDS_KEY, JSON.stringify([]));
    }

    if (!localStorage.getItem(SESSIONS_KEY)) {
        localStorage.setItem(SESSIONS_KEY, JSON.stringify([]));
    }

    if (!localStorage.getItem(MARKS_KEY)) {
        localStorage.setItem(MARKS_KEY, JSON.stringify([]));
    }

    if (!localStorage.getItem(SUBJECTS_KEY)) {
        localStorage.setItem(SUBJECTS_KEY, JSON.stringify([]));
    }

    if (!localStorage.getItem(USER_PROFILE_KEY)) {
        const defaultProfile: UserProfile = {
            id: 'teacher-1',
            name: 'John Doe',
            email: 'john.doe@college.edu',
            department: 'Information Technology',
            role: 'Faculty'
        };
        localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(defaultProfile));
    }
};

initializeData();

export const dataService = {
    // --- Teachers ---
    getAllTeachers: async (): Promise<any[]> => {
        try {
            const { default: api } = await import('./api');
            const response = await api.get('/teachers');
            return response.data.success ? response.data.teachers : [];
        } catch (error) {
            console.error('Error fetching teachers:', error);
            return [];
        }
    },

    updateTeacher: async (teacherId: string, updates: any) => {
        try {
            const { default: api } = await import('./api');
            const response = await api.put(`/teachers/${teacherId}`, updates);
            return response.data;
        } catch (error) {
            console.error('Error updating teacher:', error);
            throw error;
        }
    },

    deleteTeacher: async (teacherId: string) => {
        try {
            const { default: api } = await import('./api');
            await api.delete(`/teachers/${teacherId}`);
        } catch (error) {
            console.error('Error deleting teacher:', error);
            throw error;
        }
    },

    // --- Students ---
    syncStudentsFromBackend: async (): Promise<Student[]> => {
        try {
            const { default: api } = await import('./api');
            const response = await api.get('/students');

            if (response.data.success && response.data.students) {
                // Map MongoDB students to frontend format
                const students: Student[] = response.data.students.map((s: any) => ({
                    id: s.studentId,
                    name: s.name,
                    rollNumber: s.rollNumber,
                    email: s.email,
                    departmentId: s.departmentId,
                    year: s.year,
                    section: s.section,
                    currentSemester: s.currentSemester
                }));

                // Update localStorage with fetched data
                localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
                return students;
            }

            return JSON.parse(localStorage.getItem(STUDENTS_KEY) || '[]');
        } catch (error) {
            console.error('Error syncing students from backend:', error);
            // Fallback to localStorage if API fails
            return JSON.parse(localStorage.getItem(STUDENTS_KEY) || '[]');
        }
    },

    getAllStudents: async (): Promise<Student[]> => {
        try {
            // Try to sync from backend first
            return await dataService.syncStudentsFromBackend();
        } catch (error) {
            console.error('Error getting students:', error);
            // Fallback to localStorage
            return JSON.parse(localStorage.getItem(STUDENTS_KEY) || '[]');
        }
    },

    getStudentsByFilter: async (deptId: string, year: number, section: string): Promise<Student[]> => {
        const all = await dataService.getAllStudents();
        return all.filter(s =>
            s.departmentId === deptId &&
            s.year === year &&
            s.section === section
        );
    },

    addStudent: async (student: Student & { password?: string }) => {
        try {
            // Import api dynamically to avoid circular dependency
            const { default: api } = await import('./api');

            // Send to MongoDB API
            const response = await api.post('/students', {
                name: student.name,
                email: student.email,
                rollNumber: student.rollNumber,
                password: student.password || student.rollNumber, // Use roll number as default password
                departmentId: student.departmentId,
                year: student.year,
                section: student.section,
                currentSemester: student.currentSemester
            });

            // Also save to localStorage for immediate UI update
            const all = await dataService.getAllStudents();
            all.push(student);
            localStorage.setItem(STUDENTS_KEY, JSON.stringify(all));

            return response.data;
        } catch (error: any) {
            console.error('Add student error:', error);
            throw new Error(error.response?.data?.message || 'Failed to add student');
        }
    },

    bulkAddStudents: async (students: any[]) => {
        try {
            const { default: api } = await import('./api');
            const response = await api.post('/students/bulk', { students });

            if (response.data.success) {
                // Sync from backend to ensure localStorage is fresh
                await dataService.syncStudentsFromBackend();
            }

            return response.data.results || { success: 0, failed: 0, errors: [] };
        } catch (error: any) {
            console.error('Bulk add error:', error);
            throw new Error(error.response?.data?.message || 'Failed to process bulk import');
        }
    },

    updateStudent: async (id: string, updates: Partial<Student>) => {
        try {
            const { default: api } = await import('./api');
            await api.put(`/students/${id}`, updates);

            // Sync local storage
            const all = JSON.parse(localStorage.getItem(STUDENTS_KEY) || '[]');
            const index = all.findIndex(s => s.id === id);
            if (index !== -1) {
                all[index] = { ...all[index], ...updates };
                localStorage.setItem(STUDENTS_KEY, JSON.stringify(all));
            }
        } catch (error) {
            console.error('Error updating student:', error);
            throw error;
        }
    },

    deleteStudent: async (id: string) => {
        try {
            const { default: api } = await import('./api');
            await api.delete(`/students/${id}`);

            // Sync local storage
            const all = JSON.parse(localStorage.getItem(STUDENTS_KEY) || '[]');
            const updated = all.filter(s => s.id !== id);
            localStorage.setItem(STUDENTS_KEY, JSON.stringify(updated));
        } catch (error) {
            console.error('Error deleting student:', error);
            throw error;
        }
    },

    clearAllStudents: () => {
        localStorage.setItem(STUDENTS_KEY, JSON.stringify([]));
    },

    // --- Subjects ---
    addSubject: async (subject: Subject) => {
        try {
            const { default: api } = await import('./api');

            // Send to MongoDB API
            const response = await api.post('/subjects', {
                name: subject.name,
                code: subject.code,
                departmentId: subject.departmentId,
                year: subject.year,
                semester: subject.semester,
                teacherId: subject.teacherId,
                credits: subject.credits || 3
            });

            // Also save to localStorage for immediate UI update
            const all: Subject[] = JSON.parse(localStorage.getItem(SUBJECTS_KEY) || '[]');
            all.push(subject);
            localStorage.setItem(SUBJECTS_KEY, JSON.stringify(all));

            return response.data;
        } catch (error: any) {
            console.error('Add subject error:', error);
            throw new Error(error.response?.data?.message || 'Failed to add subject');
        }
    },

    getAllSubjects: async (): Promise<Subject[]> => {
        try {
            const { default: api } = await import('./api');
            const response = await api.get('/subjects');

            if (response.data.success && response.data.subjects) {
                // Map MongoDB subjects to frontend format
                const subjects: Subject[] = response.data.subjects.map((s: any) => ({
                    id: s.subjectId,
                    name: s.name,
                    code: s.code,
                    departmentId: s.departmentId,
                    year: s.year,
                    semester: s.semester,
                    teacherId: s.teacherId,
                    credits: s.credits || 3
                }));

                // Update localStorage with fetched data
                localStorage.setItem(SUBJECTS_KEY, JSON.stringify(subjects));
                return subjects;
            }

            return JSON.parse(localStorage.getItem(SUBJECTS_KEY) || '[]');
        } catch (error) {
            console.error('Error fetching subjects from backend:', error);
            // Fallback to localStorage if API fails
            return JSON.parse(localStorage.getItem(SUBJECTS_KEY) || '[]');
        }
    },

    getSubjectsByFilter: async (departmentId: string, year: number, semester?: Semester): Promise<Subject[]> => {
        const all = await dataService.getAllSubjects();
        return all.filter(s =>
            s.departmentId === departmentId &&
            s.year === year &&
            (semester === undefined || s.semester === semester)
        );
    },

    getSubjectById: async (subjectId: string): Promise<Subject | undefined> => {
        const all = await dataService.getAllSubjects();
        return all.find(s => s.id === subjectId);
    },

    deleteSubject: async (subjectId: string) => {
        try {
            const { default: api } = await import('./api');
            await api.delete(`/subjects/${subjectId}`);

            // Also remove from localStorage
            const all: Subject[] = JSON.parse(localStorage.getItem(SUBJECTS_KEY) || '[]');
            const updated = all.filter(s => s.id !== subjectId);
            localStorage.setItem(SUBJECTS_KEY, JSON.stringify(updated));
        } catch (error) {
            console.error('Error deleting subject:', error);
            throw error;
        }
    },

    getTeacherSubjects: async (teacherId: string): Promise<Subject[]> => {
        const all = await dataService.getAllSubjects();
        return all.filter(s => s.teacherId === teacherId);
    },

    // --- Attendance ---
    saveAttendance: async (sessionId: string, timestamp: string, records: Omit<AttendanceRecord, 'id' | 'timestamp'>[], topicCovered?: string) => {
        if (records.length === 0) return;

        const first = records[0];
        const students = await dataService.getAllStudents();
        const sampleStudent = students.find(s => s.id === first.studentId);
        if (!sampleStudent) return;

        const dept = departments.find(d => d.id === sampleStudent.departmentId);

        // Create new records with MongoDB format
        const mongoRecords = records.map(r => {
            const student = students.find(s => s.id === r.studentId);
            // Extract period number from string (e.g., "Period 1" -> 1)
            const periodNumber = typeof r.period === 'string' ?
                parseInt(r.period.replace(/\D/g, '')) : r.period;

            return {
                recordId: `att-${crypto.randomUUID()}`,
                studentId: r.studentId,
                rollNumber: student?.rollNumber || '',
                subjectId: r.subject,
                subjectName: r.subject,
                date: new Date(r.date),
                period: periodNumber,
                status: r.status,
                departmentId: sampleStudent.departmentId,
                year: sampleStudent.year,
                section: sampleStudent.section,
                semester: sampleStudent.currentSemester
            };
        });

        try {
            // Save to MongoDB only
            const { default: api } = await import('./api');
            await api.post('/attendance', { records: mongoRecords, topicCovered });
        } catch (error) {
            console.error('Error saving attendance to MongoDB:', error);
            throw error;
        }
    },

    getAttendanceBySession: async (sessionId: string): Promise<AttendanceRecord[]> => {
        try {
            // Try to fetch from backend first
            const { default: api } = await import('./api');
            const response = await api.get(`/attendance/session/${sessionId}`);

            if (response.data.success && response.data.records) {
                // Map backend records to frontend format
                return response.data.records.map((r: any) => ({
                    id: r.recordId || r._id,
                    studentId: r.studentId,
                    status: r.status,
                    subject: r.subjectName,
                    teacherId: r.teacherId || 'teacher-1',
                    date: new Date(r.date).toISOString().split('T')[0],
                    period: r.period,
                    timestamp: r.createdAt || new Date().toISOString()
                }));
            }
        } catch (error) {
            console.error('Error fetching attendance from backend:', error);
        }

        // Fallback to localStorage
        const allRecords: AttendanceRecord[] = JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]');
        const sessions = await dataService.getAllSessions();
        const session = sessions.find(s => s.id === sessionId);
        if (!session) return [];

        return allRecords.filter(r =>
            r.date === session.date &&
            r.subject === session.subject &&
            r.period === session.period
        );
    },

    updateAttendance: async (sessionId: string, timestamp: string, records: Omit<AttendanceRecord, 'id' | 'timestamp'>[], topicCovered?: string) => {
        const allSessions: AttendanceSession[] = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]');

        const sessionIndex = allSessions.findIndex(s => s.id === sessionId);
        if (sessionIndex === -1) return;

        const session = allSessions[sessionIndex];

        // Get students for MongoDB format
        const students = await dataService.getAllStudents();
        const first = records[0];
        const sampleStudent = students.find(s => s.id === first.studentId);
        if (!sampleStudent) return;

        // Create MongoDB formatted records
        const mongoRecords = records.map(r => {
            const student = students.find(s => s.id === r.studentId);
            // Extract period number from string (e.g., "Period 1" -> 1)
            const periodNumber = typeof r.period === 'string' ?
                parseInt(r.period.replace(/\D/g, '')) : r.period;

            return {
                recordId: `att-${crypto.randomUUID()}`,
                studentId: r.studentId,
                rollNumber: student?.rollNumber || '',
                subjectId: r.subject,
                subjectName: r.subject,
                date: new Date(r.date),
                period: periodNumber,
                status: r.status,
                departmentId: sampleStudent.departmentId,
                year: sampleStudent.year,
                section: sampleStudent.section,
                semester: sampleStudent.currentSemester
            };
        });

        try {
            // Update in MongoDB
            const { default: api } = await import('./api');

            // Delete old attendance records for this session
            await api.delete('/attendance/session', {
                data: {
                    date: session.date,
                    subject: session.subject,
                    period: session.period,
                    departmentId: session.classInfo.departmentId,
                    year: session.classInfo.year,
                    section: session.classInfo.section
                }
            });

            // Save new records
            // Save new records to MongoDB
            await api.post('/attendance', { records: mongoRecords, topicCovered });
        } catch (error) {
            console.error('Error updating attendance in MongoDB:', error);
            throw error;
        }
    },

    isSessionEditable: async (sessionId: string): Promise<boolean> => {
        const sessions = await dataService.getAllSessions();
        const session = sessions.find(s => s.id === sessionId);
        if (!session) return false;

        // Requirement: "within the permitted time". Let's use 24 hours.
        const sessionDate = new Date(session.date);
        const now = new Date();
        const diffInHours = (now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60);

        return true; // Allow teachers to edit any session
    },

    syncSessionsFromBackend: async (): Promise<AttendanceSession[]> => {
        try {
            const { default: api } = await import('./api');
            const response = await api.get('/attendance/sessions');

            if (response.data.success && response.data.sessions) {
                // Map MongoDB sessions to frontend format
                const sessions: AttendanceSession[] = response.data.sessions.map((s: any) => {
                    // Get department info for display
                    const dept = departments.find(d => d.id === s.classInfo.departmentId);

                    return {
                        id: s.id,
                        date: s.date,
                        subject: s.subject,
                        period: s.period,
                        classInfo: {
                            departmentId: s.classInfo.departmentId,
                            departmentName: dept?.name || 'Unknown',
                            departmentCode: dept?.code || 'UNK',
                            year: s.classInfo.year,
                            section: s.classInfo.section
                        },
                        totalStudents: s.totalStudents,
                        presentCount: s.presentCount,
                        absentCount: s.absentCount,
                        odCount: s.odCount
                    };
                });

                // Update localStorage with fetched sessions
                localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
                return sessions;
            }

            return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]');
        } catch (error) {
            console.error('Error syncing sessions from backend:', error);
            // Fallback to localStorage if API fails
            return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]');
        }
    },

    getAllSessions: async (): Promise<AttendanceSession[]> => {
        try {
            // Try to sync from backend first
            return await dataService.syncSessionsFromBackend();
        } catch (error) {
            console.error('Error getting sessions:', error);
            // Fallback to localStorage
            return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]');
        }
    },

    // Get stats for a specific student
    getStudentStats: async (studentId: string) => {
        try {
            const { default: api } = await import('./api');
            const response = await api.get(`/attendance/student/${studentId}`);

            if (response.data.success) {
                const records = response.data.records;
                const totalClasses = records.length;
                const present = records.filter((r: any) => r.status === 'present').length;
                const absent = records.filter((r: any) => r.status === 'absent').length;
                const od = records.filter((r: any) => r.status === 'od').length;

                return {
                    totalClasses,
                    present,
                    absent,
                    od,
                    percentage: totalClasses > 0 ? Math.round((present / totalClasses) * 100) : 0
                };
            }
        } catch (error) {
            console.error('Error fetching student stats from backend:', error);
        }

        // Fallback to localStorage
        const records: AttendanceRecord[] = JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]');
        const studentRecords = records.filter(r => r.studentId === studentId);

        const totalClasses = studentRecords.length;
        const present = studentRecords.filter(r => r.status === 'present').length;
        const absent = studentRecords.filter(r => r.status === 'absent').length;
        const od = studentRecords.filter(r => r.status === 'od').length;

        return {
            totalClasses,
            present,
            absent,
            od,
            percentage: totalClasses > 0 ? Math.round((present / totalClasses) * 100) : 0
        };
    },

    getStudentAttendanceBySubject: async (studentId: string) => {
        try {
            const { default: api } = await import('./api');
            const response = await api.get(`/attendance/student/${studentId}`);

            if (response.data.success && response.data.subjectStats) {
                return response.data.subjectStats;
            }
        } catch (error) {
            console.error('Error fetching student subject stats from backend:', error);
        }

        // Fallback to localStorage
        const records: AttendanceRecord[] = JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]');
        const studentRecords = records.filter(r => r.studentId === studentId);

        const subjectStats: { [key: string]: { total: number; present: number; absent: number; od: number } } = {};

        studentRecords.forEach(r => {
            if (!subjectStats[r.subject]) {
                subjectStats[r.subject] = { total: 0, present: 0, absent: 0, od: 0 };
            }
            subjectStats[r.subject].total += 1;
            if (r.status === 'present') subjectStats[r.subject].present += 1;
            else if (r.status === 'absent') subjectStats[r.subject].absent += 1;
            else if (r.status === 'od') subjectStats[r.subject].od += 1;
        });

        return Object.keys(subjectStats).map(subject => ({
            subject,
            ...subjectStats[subject],
            percentage: subjectStats[subject].total > 0
                ? Math.round((subjectStats[subject].present / subjectStats[subject].total) * 100)
                : 0
        }));
    },

    // --- Marks Management ---
    saveMarks: async (marks: SubjectMark[]) => {
        const allMarks: SubjectMark[] = JSON.parse(localStorage.getItem(MARKS_KEY) || '[]');

        // Convert to MongoDB format
        const students = await dataService.getAllStudents();
        const mongoMarks = marks.map(m => {
            const student = students.find(s => s.id === m.studentId);
            return {
                markId: `mark-${crypto.randomUUID()}`,
                studentId: m.studentId,
                rollNumber: student?.rollNumber || '',
                subjectId: m.subject,
                subjectName: m.subject,
                assessmentType: m.assessmentType,
                marks: m.marks,
                maxMarks: m.maxMarks || 100, // Use the maxMarks from the mark object
                departmentId: student?.departmentId || '1',
                year: student?.year || 1,
                section: student?.section || 'A',
                semester: student?.currentSemester || 1
            };
        });

        try {
            // Save to MongoDB
            const { default: api } = await import('./api');
            await api.post('/marks', { marks: mongoMarks });

            // Also save to localStorage for backward compatibility
            const updatedMarks = [...allMarks, ...marks];
            localStorage.setItem(MARKS_KEY, JSON.stringify(updatedMarks));
        } catch (error) {
            console.error('Error saving marks to MongoDB:', error);
            throw error;
        }
    },

    getStudentMarks: async (studentId: string): Promise<SubjectMark[]> => {
        try {
            const { default: api } = await import('./api');
            const response = await api.get(`/marks/student/${studentId}`);
            if (response.data.success) {
                return response.data.marks.map((m: any) => ({
                    id: m.markId,
                    studentId: m.studentId,
                    rollNumber: m.rollNumber,
                    subject: m.subjectName,
                    subjectName: m.subjectName,
                    assessmentType: m.assessmentType,
                    marks: m.marks,
                    maxMarks: m.maxMarks,
                    timestamp: m.createdAt
                }));
            }
        } catch (error) {
            console.error('Error fetching student marks:', error);
        }
        const allMarks: SubjectMark[] = JSON.parse(localStorage.getItem(MARKS_KEY) || '[]');
        return allMarks.filter(m => m.studentId === studentId);
    },

    getMarksForClass: async (deptId: string, year: number, section: string, subject: string, assessmentType: AssessmentType) => {
        try {
            const students = await dataService.getStudentsByFilter(deptId, year, section);

            // Try to fetch marks from backend first
            let allMarks: SubjectMark[] = [];
            try {
                const { default: api } = await import('./api');
                const response = await api.get('/marks', {
                    params: { departmentId: deptId, year, section, subjectName: subject, assessmentType }
                });
                if (response.data.success) {
                    allMarks = response.data.marks.map((m: any) => ({
                        id: m.markId,
                        studentId: m.studentId,
                        rollNumber: m.rollNumber,
                        subject: m.subjectName, // Mapping subjectName to subject
                        subjectName: m.subjectName,
                        assessmentType: m.assessmentType,
                        marks: m.marks,
                        maxMarks: m.maxMarks,
                        date: m.date,
                        uploadedBy: m.teacherId,
                        timestamp: m.createdAt
                    }));
                }
            } catch (err) {
                console.error('Error fetching marks from backend:', err);
                allMarks = JSON.parse(localStorage.getItem(MARKS_KEY) || '[]');
            }

            return students.map(student => {
                const mark = allMarks.find(m =>
                    m.studentId === student.id &&
                    (m.subjectName === subject || m.subject === subject) &&
                    m.assessmentType === assessmentType
                );
                return {
                    student,
                    mark: mark?.marks || null,
                    markId: mark?.id || null
                };
            });
        } catch (error) {
            console.error('Error in getMarksForClass:', error);
            return [];
        }
    },

    updateMark: async (markId: string, marks: number) => {
        try {
            // Update in MongoDB
            const { default: api } = await import('./api');
            await api.put(`/marks/${markId}`, { marks });

            // Also update in localStorage for backward compatibility
            const allMarks: SubjectMark[] = JSON.parse(localStorage.getItem(MARKS_KEY) || '[]');
            const index = allMarks.findIndex(m => m.id === markId);
            if (index !== -1) {
                allMarks[index].marks = marks;
                allMarks[index].timestamp = new Date().toISOString();
                localStorage.setItem(MARKS_KEY, JSON.stringify(allMarks));
            }
        } catch (error) {
            console.error('Error updating mark in MongoDB:', error);
            throw error;
        }
    },

    // Get Performance Data (now uses real marks)
    getStudentPerformance: async (studentId: string) => {
        const marks = await dataService.getStudentMarks(studentId);

        // Group marks by subject and calculate average
        const subjectStats: { [key: string]: { total: number, count: number, scores: number[] } } = {};
        marks.forEach(m => {
            if (!subjectStats[m.subject]) {
                subjectStats[m.subject] = { total: 0, count: 0, scores: [] };
            }
            subjectStats[m.subject].total += m.marks;
            subjectStats[m.subject].count += 1;
            subjectStats[m.subject].scores.push(m.marks);
        });

        const marksData = Object.keys(subjectStats).map(subject => ({
            subject,
            score: Math.round(subjectStats[subject].total / subjectStats[subject].count),
            fullMark: 100
        }));

        // Calculate overall average
        const totalMarks = Object.values(subjectStats).reduce((sum, s) => sum + s.total, 0);
        const totalCount = Object.values(subjectStats).reduce((sum, s) => sum + s.count, 0);
        const averageMarks = totalCount > 0 ? Math.round(totalMarks / totalCount) : 0;

        // Fetch attendance history if needed (here we can mock or fetch from backend)
        let attendanceHistory: any[] = [];
        try {
            const { default: api } = await import('./api');
            const response = await api.get(`/attendance/student/${studentId}`);
            if (response.data.success) {
                // Simplified monthly grouping for history chart
                const records = response.data.records;
                const monthlyData: { [key: string]: { present: number, total: number } } = {};

                records.forEach((r: any) => {
                    const month = new Date(r.date).toLocaleString('default', { month: 'short' });
                    if (!monthlyData[month]) monthlyData[month] = { present: 0, total: 0 };
                    monthlyData[month].total++;
                    if (r.status === 'present') monthlyData[month].present++;
                });

                attendanceHistory = Object.keys(monthlyData).map(month => ({
                    month,
                    percentage: Math.round((monthlyData[month].present / monthlyData[month].total) * 100)
                }));
            }
        } catch (error) {
            console.error('Error fetching attendance history:', error);
        }

        return {
            marks: marksData,
            allMarks: marks,
            attendanceHistory: attendanceHistory,
            averageMarks: averageMarks,
            rank: 0
        };
    },

    // --- User Profile ---
    getUserProfile: (): UserProfile => {
        const saved = localStorage.getItem(USER_PROFILE_KEY);
        if (saved) return JSON.parse(saved);

        const defaultProfile: UserProfile = {
            id: 'teacher-1',
            name: 'John Doe',
            email: 'john.doe@college.edu',
            department: 'Information Technology',
            role: 'Faculty'
        };
        return defaultProfile;
    },

    updateUserProfile: (profile: Partial<UserProfile>) => {
        const current = dataService.getUserProfile();
        const updated = { ...current, ...profile };
        localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updated));

        // Trigger a custom event so other components know the profile changed
        window.dispatchEvent(new Event('user-profile-updated'));

        return updated;
    },

    // --- AI-Based Attendance Analytics ---
    getAttendanceAnalytics: async () => {
        const students = await dataService.getAllStudents();
        let records: any[] = [];

        try {
            const { default: api } = await import('./api');
            const response = await api.get('/attendance');
            if (response.data.success) {
                records = response.data.records;
            }
        } catch (error) {
            console.error('Error fetching all attendance for analytics:', error);
            records = JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]');
        }

        const studentAnalytics = students.map(student => {
            const studentRecords = records.filter(r => r.studentId === student.id);
            const totalPeriods = studentRecords.length;
            const presentPeriods = studentRecords.filter(r => r.status === 'present').length;
            const percentage = totalPeriods > 0 ? Math.round((presentPeriods / totalPeriods) * 100) : 0;
            const riskStatus = percentage < 75 ? 'At Risk' : 'Safe';

            return {
                studentId: student.id,
                name: student.name,
                rollNumber: student.rollNumber,
                departmentId: student.departmentId,
                year: student.year,
                section: student.section,
                totalDays: totalPeriods, // Using totalDays label but it's periods
                presentDays: presentPeriods,
                percentage,
                riskStatus
            };
        });

        const atRiskStudents = studentAnalytics.filter(s => s.riskStatus === 'At Risk');
        const totalStudents = students.length;
        const avgAttendance = totalStudents > 0
            ? Math.round(studentAnalytics.reduce((acc, s) => acc + s.percentage, 0) / totalStudents)
            : 0;

        return {
            totalStudents,
            avgAttendance,
            atRiskCount: atRiskStudents.length,
            atRiskStudents: atRiskStudents.sort((a, b) => a.percentage - b.percentage),
            allStudents: studentAnalytics
        };
    },

    getStudentRiskStatus: async (studentId: string) => {
        let records: any[] = [];
        try {
            const { default: api } = await import('./api');
            const response = await api.get(`/attendance/student/${studentId}`);
            if (response.data.success) {
                records = response.data.records;
            }
        } catch (error) {
            console.error('Error fetching student risk status:', error);
            const allRecords: AttendanceRecord[] = JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]');
            records = allRecords.filter(r => r.studentId === studentId);
        }

        const totalDays = records.length;
        const presentDays = records.filter(r => r.status === 'present').length;
        const absentDays = records.filter(r => r.status === 'absent').length;
        const odDays = records.filter(r => r.status === 'od').length;
        const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
        const riskStatus = percentage < 75 ? 'At Risk' : 'Safe';

        return {
            totalDays,
            presentDays,
            absentDays,
            odDays,
            percentage,
            riskStatus,
            isAtRisk: percentage < 75,
            daysNeeded: percentage < 75 ? Math.ceil((0.75 * totalDays) - presentDays) : 0
        };
    },

    // --- Leave / OD Management ---
    applyLeave: async (leaveData: any) => {
        try {
            const { default: api } = await import('./api');
            const response = await api.post('/leaves', leaveData);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to submit leave');
        }
    },

    getStudentLeaves: async (studentId: string) => {
        try {
            const { default: api } = await import('./api');
            const response = await api.get(`/leaves/student/${studentId}`);
            return response.data.leaves;
        } catch (error) {
            console.error('Error fetching student leaves:', error);
            return [];
        }
    },

    getAllLeaves: async () => {
        try {
            const { default: api } = await import('./api');
            const response = await api.get('/leaves/all');
            return response.data.leaves;
        } catch (error) {
            console.error('Error fetching all leaves:', error);
            return [];
        }
    },

    updateLeaveStatus: async (requestId: string, status: string) => {
        try {
            console.log(`[dataService] Updating leave ${requestId} to status: ${status}`);
            const { default: api } = await import('./api');
            const response = await api.put(`/leaves/${requestId}`, { status });
            console.log(`[dataService] Leave update response:`, response.data);
            return response.data;
        } catch (error: any) {
            console.error('[dataService] Error updating leave status:', error?.response?.data || error.message);
            throw error;
        }
    },

    uploadLeaveAttachments: async (requestId: string, formData: FormData) => {
        try {
            // Use direct axios call to avoid default Content-Type header issues
            const { default: axios } = await import('axios');
            const token = localStorage.getItem('token');
            const BASE_URL = import.meta.env.VITE_API_URL;

            const response = await axios.post(
                `${BASE_URL}/leaves/${requestId}/upload`,
                formData, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    // Let browser set Content-Type with boundary
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error uploading attachments:', error);
            throw error;
        }
    },

    // --- Notifications ---
    getNotifications: async () => {
        try {
            const { default: api } = await import('./api');
            const response = await api.get('/notifications');
            return response.data.notifications;
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return [];
        }
    },

    sendNotification: async (data: { userId: string, title: string, message: string, type?: string, link?: string }) => {
        try {
            const { default: api } = await import('./api');
            const response = await api.post('/notifications', data);
            return response.data;
        } catch (error) {
            console.error('Error sending notification:', error);
            throw error;
        }
    },

    markNotificationRead: async (id: string) => {
        try {
            const { default: api } = await import('./api');
            await api.put(`/notifications/${id}/read`);
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    },

    markAllNotificationsRead: async () => {
        try {
            const { default: api } = await import('./api');
            await api.put('/notifications/read-all');
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    },

    // --- Timetable ---
    getClassTimetable: async (departmentId: string, year: number, section: string) => {
        try {
            const { default: api } = await import('./api');
            const response = await api.get('/timetable/class', {
                params: { departmentId, year, section }
            });
            return response.data.timetable;
        } catch (error) {
            console.error('Error fetching timetable:', error);
            return [];
        }
    },

    updateClassTimetable: async (data: { departmentId: string, year: number, section: string, days: any[] }) => {
        try {
            const { default: api } = await import('./api');
            const response = await api.post('/timetable/class', data);
            return response.data;
        } catch (error: any) {
            console.error('Error updating timetable:', error);
            throw new Error(error.response?.data?.message || 'Failed to update timetable');
        }
    },

    getTeacherTimetable: async (teacherId: string) => {
        try {
            const { default: api } = await import('./api');
            const response = await api.get(`/timetable/teacher/${teacherId}`);
            return response.data.timetable;
        } catch (error) {
            console.error('Error fetching teacher timetable:', error);
            return [];
        }
    }
};
