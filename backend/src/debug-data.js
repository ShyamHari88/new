
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';
import Student from './models/Student.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const checkData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check Advisors
        const advisors = await User.find({ role: 'advisor' });
        console.log('\n--- Advisors ---');
        advisors.forEach(a => {
            console.log(`Name: ${a.name}, Dept: '${a.departmentId}', Section: '${a.section}'`);
        });

        if (studentUsers.length === 0) console.log('No Student Users found.');
        else {
            studentUsers.forEach(s => {
                console.log(`User: ${s.name}, Dept: '${s.departmentId}', Sec: '${s.section}'`);
            });
        }

        // Check Students (Student Model)
        const studentRecords = await Student.find({});
        console.log('\n--- Student Records (Profile) count: ' + studentRecords.length + ' ---');
        if (studentRecords.length === 0) console.log('No Student Profiles found.');
        else {
            studentRecords.forEach(s => {
                console.log(`Profile: ${s.name}, Dept: '${s.departmentId}', Sec: '${s.section}'`);
            });
        }

        if (advisors.length > 0) {
            const advisor = advisors[0];
            console.log(`\nChecking matches for Advisor: ${advisor.name} (Dept: '${advisor.departmentId}', Sec: '${advisor.section}')`);

            const matchCount = await Student.countDocuments({
                departmentId: advisor.departmentId,
                section: advisor.section
            });
            console.log(`Found ${matchCount} matching Student records perfectly.`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

checkData();
