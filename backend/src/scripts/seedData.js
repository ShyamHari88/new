// MongoDB Sample Data Initialization Script
// Run this file to populate your database with sample data
// Usage: npm run seed

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB Connection URI from .env
const MONGODB_URI = process.env.MONGODB_URI;

// ============================================
// 1. DEPARTMENTS COLLECTION
// ============================================
const departments = [
    {
        departmentId: '1',
        name: 'Information Technology',
        code: 'IT',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        departmentId: '2',
        name: 'Computer Science',
        code: 'CSE',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        departmentId: '3',
        name: 'Electronics and Communication',
        code: 'ECE',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        departmentId: '4',
        name: 'Mechanical Engineering',
        code: 'MECH',
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

// ============================================
// 2. USERS COLLECTION (Teachers, Students, Admin)
// ============================================
const users = [
    // Admin User
    {
        userId: 'admin-1',
        name: 'System Administrator',
        email: 'admin@college.edu',
        password: 'admin123', // Will be hashed
        role: 'admin',
        departmentId: '1',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    // Teacher Users
    {
        userId: 'teacher-1',
        name: 'Dr. John Doe',
        email: 'teacher@college.edu',
        password: 'teacher123', // Will be hashed
        role: 'teacher',
        departmentId: '1',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        userId: 'teacher-2',
        name: 'Prof. Sarah Smith',
        email: 'sarah.smith@college.edu',
        password: 'teacher123',
        role: 'teacher',
        departmentId: '1',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    // Student Users
    {
        userId: 'student-1',
        name: 'Tamil',
        email: 'tamil@college.edu',
        password: '23IT151', // Roll number as password
        role: 'student',
        rollNumber: '23IT151',
        departmentId: '1',
        studentId: 'sample-student-1',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        userId: 'student-2',
        name: 'Priya Kumar',
        email: 'priya.kumar@college.edu',
        password: '23IT152',
        role: 'student',
        rollNumber: '23IT152',
        departmentId: '1',
        studentId: 'sample-student-2',
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

// ============================================
// 3. STUDENTS COLLECTION
// ============================================
const students = [
    {
        studentId: 'sample-student-1',
        name: 'Tamil',
        rollNumber: '23IT151',
        email: 'tamil@college.edu',
        departmentId: '1',
        year: 3,
        section: 'C',
        currentSemester: 5,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        studentId: 'sample-student-2',
        name: 'Priya Kumar',
        rollNumber: '23IT152',
        email: 'priya.kumar@college.edu',
        departmentId: '1',
        year: 3,
        section: 'C',
        currentSemester: 5,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        studentId: 'sample-student-3',
        name: 'Rahul Sharma',
        rollNumber: '23IT153',
        email: 'rahul.sharma@college.edu',
        departmentId: '1',
        year: 3,
        section: 'C',
        currentSemester: 5,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        studentId: 'sample-student-4',
        name: 'Ananya Reddy',
        rollNumber: '23IT154',
        email: 'ananya.reddy@college.edu',
        departmentId: '1',
        year: 3,
        section: 'C',
        currentSemester: 5,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        studentId: 'sample-student-5',
        name: 'Vikram Patel',
        rollNumber: '23IT155',
        email: 'vikram.patel@college.edu',
        departmentId: '1',
        year: 3,
        section: 'C',
        currentSemester: 5,
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

// ============================================
// 4. SUBJECTS COLLECTION
// ============================================
const subjects = [
    {
        subjectId: 'subject-1',
        name: 'Data Structures and Algorithms',
        code: 'CS301',
        semester: 5,
        departmentId: '1',
        year: 3,
        teacherId: 'teacher-1',
        credits: 4,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        subjectId: 'subject-2',
        name: 'Database Management Systems',
        code: 'CS302',
        semester: 5,
        departmentId: '1',
        year: 3,
        teacherId: 'teacher-1',
        credits: 4,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        subjectId: 'subject-3',
        name: 'Operating Systems',
        code: 'CS303',
        semester: 5,
        departmentId: '1',
        year: 3,
        teacherId: 'teacher-2',
        credits: 3,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        subjectId: 'subject-4',
        name: 'Computer Networks',
        code: 'CS304',
        semester: 5,
        departmentId: '1',
        year: 3,
        teacherId: 'teacher-2',
        credits: 3,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        subjectId: 'subject-5',
        name: 'Web Technologies',
        code: 'CS305',
        semester: 5,
        departmentId: '1',
        year: 3,
        teacherId: 'teacher-1',
        credits: 3,
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

// ============================================
// 5. ATTENDANCE SESSIONS COLLECTION
// ============================================
const attendanceSessions = [
    {
        sessionId: 'session-1',
        date: '2026-01-20',
        subject: 'Data Structures and Algorithms',
        subjectId: 'subject-1',
        period: '1',
        classInfo: {
            departmentId: '1',
            departmentName: 'Information Technology',
            departmentCode: 'IT',
            year: 3,
            section: 'C'
        },
        totalStudents: 5,
        presentCount: 4,
        absentCount: 1,
        odCount: 0,
        teacherId: 'teacher-1',
        isEditable: true,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        sessionId: 'session-2',
        date: '2026-01-20',
        subject: 'Database Management Systems',
        subjectId: 'subject-2',
        period: '2',
        classInfo: {
            departmentId: '1',
            departmentName: 'Information Technology',
            departmentCode: 'IT',
            year: 3,
            section: 'C'
        },
        totalStudents: 5,
        presentCount: 5,
        absentCount: 0,
        odCount: 0,
        teacherId: 'teacher-1',
        isEditable: true,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        sessionId: 'session-3',
        date: '2026-01-19',
        subject: 'Data Structures and Algorithms',
        subjectId: 'subject-1',
        period: '1',
        classInfo: {
            departmentId: '1',
            departmentName: 'Information Technology',
            departmentCode: 'IT',
            year: 3,
            section: 'C'
        },
        totalStudents: 5,
        presentCount: 3,
        absentCount: 1,
        odCount: 1,
        teacherId: 'teacher-1',
        isEditable: false,
        createdAt: new Date('2026-01-19'),
        updatedAt: new Date('2026-01-19')
    }
];

// ============================================
// 6. ATTENDANCE RECORDS COLLECTION
// ============================================
const attendanceRecords = [
    // Session 1 records
    {
        recordId: 'rec-1',
        studentId: 'sample-student-1',
        sessionId: 'session-1',
        date: '2026-01-20',
        status: 'present',
        subject: 'Data Structures and Algorithms',
        subjectId: 'subject-1',
        period: '1',
        teacherId: 'teacher-1',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        recordId: 'rec-2',
        studentId: 'sample-student-2',
        sessionId: 'session-1',
        date: '2026-01-20',
        status: 'present',
        subject: 'Data Structures and Algorithms',
        subjectId: 'subject-1',
        period: '1',
        teacherId: 'teacher-1',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        recordId: 'rec-3',
        studentId: 'sample-student-3',
        sessionId: 'session-1',
        date: '2026-01-20',
        status: 'absent',
        subject: 'Data Structures and Algorithms',
        subjectId: 'subject-1',
        period: '1',
        teacherId: 'teacher-1',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        recordId: 'rec-4',
        studentId: 'sample-student-4',
        sessionId: 'session-1',
        date: '2026-01-20',
        status: 'present',
        subject: 'Data Structures and Algorithms',
        subjectId: 'subject-1',
        period: '1',
        teacherId: 'teacher-1',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        recordId: 'rec-5',
        studentId: 'sample-student-5',
        sessionId: 'session-1',
        date: '2026-01-20',
        status: 'present',
        subject: 'Data Structures and Algorithms',
        subjectId: 'subject-1',
        period: '1',
        teacherId: 'teacher-1',
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

// ============================================
// 7. MARKS COLLECTION
// ============================================
const marks = [
    {
        markId: 'mark-1',
        studentId: 'sample-student-1',
        subject: 'Data Structures and Algorithms',
        subjectId: 'subject-1',
        assessmentType: 'CIA_T1',
        marks: 85,
        maxMarks: 100,
        date: '2026-01-15',
        uploadedBy: 'teacher-1',
        createdAt: new Date('2026-01-15'),
        updatedAt: new Date('2026-01-15')
    },
    {
        markId: 'mark-2',
        studentId: 'sample-student-2',
        subject: 'Data Structures and Algorithms',
        subjectId: 'subject-1',
        assessmentType: 'CIA_T1',
        marks: 92,
        maxMarks: 100,
        date: '2026-01-15',
        uploadedBy: 'teacher-1',
        createdAt: new Date('2026-01-15'),
        updatedAt: new Date('2026-01-15')
    }
];

// ============================================
// MAIN FUNCTION TO INSERT DATA
// ============================================
async function insertSampleData() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas');

        // Hash passwords for users
        console.log('🔐 Hashing passwords...');
        for (let user of users) {
            user.password = await bcrypt.hash(user.password, 10);
        }

        // Insert data into collections
        console.log('\n📦 Inserting sample data...\n');

        const db = mongoose.connection.db;

        // 1. Departments
        await db.collection('departments').deleteMany({});
        await db.collection('departments').insertMany(departments);
        console.log(`✅ Inserted ${departments.length} departments`);

        // 2. Users
        await db.collection('users').deleteMany({});
        await db.collection('users').insertMany(users);
        console.log(`✅ Inserted ${users.length} users`);

        // 3. Students
        await db.collection('students').deleteMany({});
        await db.collection('students').insertMany(students);
        console.log(`✅ Inserted ${students.length} students`);

        // 4. Subjects
        await db.collection('subjects').deleteMany({});
        await db.collection('subjects').insertMany(subjects);
        console.log(`✅ Inserted ${subjects.length} subjects`);

        // 5. Attendance Sessions
        await db.collection('attendancesessions').deleteMany({});
        await db.collection('attendancesessions').insertMany(attendanceSessions);
        console.log(`✅ Inserted ${attendanceSessions.length} attendance sessions`);

        // 6. Attendance Records
        await db.collection('attendancerecords').deleteMany({});
        await db.collection('attendancerecords').insertMany(attendanceRecords);
        console.log(`✅ Inserted ${attendanceRecords.length} attendance records`);

        // 7. Marks
        await db.collection('marks').deleteMany({});
        await db.collection('marks').insertMany(marks);
        console.log(`✅ Inserted ${marks.length} marks`);

        console.log('\n🎉 Sample data inserted successfully!');
        console.log('\n📊 Summary:');
        console.log(`   - Departments: ${departments.length}`);
        console.log(`   - Users: ${users.length}`);
        console.log(`   - Students: ${students.length}`);
        console.log(`   - Subjects: ${subjects.length}`);
        console.log(`   - Attendance Sessions: ${attendanceSessions.length}`);
        console.log(`   - Attendance Records: ${attendanceRecords.length}`);
        console.log(`   - Marks: ${marks.length}`);

        console.log('\n🔑 Login Credentials:');
        console.log('   Admin:   admin@college.edu / admin123');
        console.log('   Teacher: teacher@college.edu / teacher123');
        console.log('   Student: tamil / 23IT151');

    } catch (error) {
        console.error('❌ Error inserting sample data:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 MongoDB connection closed');
    }
}

// Run the function
insertSampleData();
