
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';
import Student from './models/Student.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const checkMissingStudents = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const namesToCheck = ['valluvan', 'Sanjay S', 'shyam', 'hari'];

        // Check Users
        console.log('\n--- Checking Users Collection ---');
        const users = await User.find({
            $or: [
                { name: { $in: namesToCheck.map(n => new RegExp(n, 'i')) } },
                { email: { $regex: 'valluvan|san9042|shyam', $options: 'i' } }
            ]
        });

        if (users.length === 0) console.log('No matching Users found.');
        users.forEach(u => {
            console.log(`User: ${u.name} | Role: ${u.role} | Dept: '${u.departmentId}' | Sec: '${u.section}' | Year: ${u.year} | Approved: ${u.isApproved}`);
        });

        // Check Student Profiles
        console.log('\n--- Checking Student Profiles Collection ---');
        const students = await Student.find({
            $or: [
                { name: { $in: namesToCheck.map(n => new RegExp(n, 'i')) } },
                { email: { $regex: 'valluvan|san9042|shyam', $options: 'i' } }
            ]
        });

        if (students.length === 0) console.log('No matching Student Profiles found.');
        students.forEach(s => {
            console.log(`Profile: ${s.name} | Dept: '${s.departmentId}' | Sec: '${s.section}' | Year: ${s.year} | Approved: ${s.isApproved}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

checkMissingStudents();
