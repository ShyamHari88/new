
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';
import Student from './models/Student.js';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const createTestStudent = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // details matching the advisor "Test Advisor"
        const deptId = '1';
        const section = 'C';

        const userId = `user-${crypto.randomBytes(16).toString('hex')}`;
        const studentId = `student-${crypto.randomBytes(16).toString('hex')}`;

        // Create User
        await User.create({
            userId,
            name: 'Test Student C',
            email: 'student.c@college.edu',
            password: 'password123',
            role: 'student',
            studentId, // link to student record
            rollNumber: '23IT199',
            departmentId: deptId,
            section: section,
            year: 3,
            currentSemester: 5,
            isApproved: true
        });
        console.log('Created User: Test Student C');

        // Create Student Record
        await Student.create({
            studentId,
            name: 'Test Student C',
            rollNumber: '23IT199',
            email: 'student.c@college.edu',
            departmentId: deptId,
            section: section,
            year: 3,
            currentSemester: 5,
            isApproved: true,
            cgpa: 8.5
        });
        console.log('Created Student Record: Test Student C');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

createTestStudent();
