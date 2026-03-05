import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

async function fixTeachers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected\n');

        const teachers = await User.find({ role: 'teacher' });
        console.log(`Found ${teachers.length} teacher(s)`);

        for (const t of teachers) {
            t.password = 'password123';
            t.isActive = true;
            await t.save();
            console.log(`  ✅ Reset: ${t.teacherId} (${t.name}) → password: "password123"`);
        }

        console.log('\n=== ALL USERS SUMMARY ===');
        const allUsers = await User.find({}).select('role name advisorId teacherId rollNumber email isActive');
        const grouped = {};
        allUsers.forEach(u => {
            if (!grouped[u.role]) grouped[u.role] = [];
            grouped[u.role].push(u);
        });

        for (const [role, users] of Object.entries(grouped)) {
            console.log(`\n[${role.toUpperCase()}] (${users.length})`);
            users.forEach(u => {
                const loginId = u.advisorId || u.teacherId || u.rollNumber || u.email;
                console.log(`  • ${u.name} | Login: "${loginId}" | Active: ${u.isActive}`);
            });
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

fixTeachers();
