import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Student from './src/models/Student.js';

dotenv.config();

async function findAdvisors() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected');

        console.log('\n===== ALL ADVISORS =====');
        const advisors = await User.find({ role: 'advisor' });
        if (advisors.length === 0) {
            console.log('❌ NO advisors found in database!');
        } else {
            advisors.forEach((a, i) => {
                console.log(`\n[${i + 1}] Advisor:`);
                console.log(`    Name       : ${a.name}`);
                console.log(`    advisorId  : ${a.advisorId}`);
                console.log(`    userId     : ${a.userId}`);
                console.log(`    Email      : ${a.email}`);
                console.log(`    Department : ${a.departmentId}`);
                console.log(`    Section    : ${a.section}`);
                console.log(`    _id        : ${a._id}`);
                console.log(`    isActive   : ${a.isActive}`);
            });
        }

        console.log('\n===== ALL STUDENTS =====');
        const students = await Student.find().select('name rollNumber studentId departmentId section isApproved');
        console.log(`Total: ${students.length}`);
        if (students.length > 0) {
            console.table(students.map(s => ({
                name: s.name,
                rollNumber: s.rollNumber,
                studentId: s.studentId,
                dept: s.departmentId,
                section: s.section,
                approved: s.isApproved
            })));
        }

        console.log('\n===== ALL STUDENT USERS =====');
        const studentUsers = await User.find({ role: 'student' }).select('name rollNumber userId departmentId section isApproved email');
        console.log(`Total: ${studentUsers.length}`);
        if (studentUsers.length > 0) {
            console.table(studentUsers.map(s => ({
                name: s.name,
                rollNumber: s.rollNumber,
                userId: s.userId,
                dept: s.departmentId,
                section: s.section,
                approved: s.isApproved,
                email: s.email
            })));
        }

        console.log('\n===== AUTH CHECK - ADVISOR LOGIN =====');
        console.log('Checking if advisor can authenticate...');
        for (const advisor of advisors) {
            const testPasswords = ['password123', 'Password@123', advisor.advisorId, '123456', 'admin123'];
            let matched = false;
            for (const pw of testPasswords) {
                try {
                    const ok = await advisor.comparePassword(pw);
                    if (ok) {
                        console.log(`  ✅ ${advisor.advisorId} password is: "${pw}"`);
                        matched = true;
                        break;
                    }
                } catch (e) { }
            }
            if (!matched) {
                console.log(`  ❌ ${advisor.advisorId} - none of the tested passwords matched. Resetting to "password123"...`);
                advisor.password = 'password123';
                await advisor.save();
                console.log(`  ✅ Password reset to "password123" for ${advisor.advisorId}`);
            }
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

findAdvisors();
