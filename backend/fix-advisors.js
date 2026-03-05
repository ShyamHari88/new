import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import crypto from 'crypto';

dotenv.config();

async function fixAllAdvisors() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // List all existing advisors first
        const existing = await User.find({ role: 'advisor' });
        console.log('=== EXISTING ADVISORS ===');
        if (existing.length === 0) {
            console.log('None found!');
        }
        existing.forEach(a => {
            console.log(`  ID: "${a.advisorId}" | Name: ${a.name} | Dept: ${a.departmentId} | Sec: ${a.section}`);
        });

        // Define all advisor IDs that SHOULD exist (including old ones the user might've created)
        const advisorsToEnsure = [
            { advisorId: 'ADV1', name: 'Class Advisor 1', email: 'adv1@college.edu', password: 'password123', departmentId: '1', section: 'A' },
            { advisorId: 'ADV001', name: 'Test Advisor', email: 'advisor@test.com', password: 'password123', departmentId: '1', section: 'C' },
            { advisorId: 'ADV002', name: 'Advisor Section B', email: 'adv2@college.edu', password: 'password123', departmentId: '1', section: 'B' },
            { advisorId: 'ADV003', name: 'Advisor Section C', email: 'adv3@college.edu', password: 'password123', departmentId: '1', section: 'C' },
        ];

        console.log('\n=== ENSURING ALL ADVISORS EXIST ===');
        for (const adv of advisorsToEnsure) {
            const existing = await User.findOne({ role: 'advisor', advisorId: adv.advisorId });
            if (existing) {
                // Update password to known value
                existing.password = adv.password;
                existing.isActive = true;
                await existing.save();
                console.log(`  ✅ Updated: "${adv.advisorId}" — password reset to "${adv.password}"`);
            } else {
                // Create it
                await User.create({
                    userId: `user-adv-${crypto.randomBytes(8).toString('hex')}`,
                    name: adv.name,
                    email: adv.email,
                    password: adv.password,
                    role: 'advisor',
                    advisorId: adv.advisorId,
                    departmentId: adv.departmentId,
                    section: adv.section,
                    isActive: true
                });
                console.log(`  🆕 Created: "${adv.advisorId}" | Dept: ${adv.departmentId} | Sec: ${adv.section}`);
            }
        }

        // Also reset admin password just in case
        const admin = await User.findOne({ role: 'admin' });
        if (admin) {
            admin.password = 'Password@123';
            await admin.save();
            console.log(`\n✅ Admin password reset: admin@college.edu / Password@123`);
        }

        // Final verification
        console.log('\n=== FINAL STATE — ALL ADVISORS ===');
        const final = await User.find({ role: 'advisor' }).select('advisorId name departmentId section email');
        final.forEach(a => {
            console.log(`  ✅ Login ID: "${a.advisorId}" | Name: ${a.name} | Dept: ${a.departmentId} | Sec: ${a.section}`);
        });

        console.log('\n=== LOGIN CREDENTIALS SUMMARY ===');
        console.log('┌──────────────────┬──────────────────┬────────────────────────────┐');
        console.log('│ Role             │ Login ID         │ Password                   │');
        console.log('├──────────────────┼──────────────────┼────────────────────────────┤');
        console.log('│ Admin            │ admin@college.edu│ Password@123               │');
        for (const a of advisorsToEnsure) {
            console.log(`│ Advisor          │ ${a.advisorId.padEnd(16)}│ password123                │`);
        }
        console.log('│ Student          │ 23IT132          │ 23IT132 (roll number)      │');
        console.log('│ Student          │ 23IT151          │ 23IT151                    │');
        console.log('│ Teacher          │ TCH001           │ (check teacher password)   │');
        console.log('└──────────────────┴──────────────────┴────────────────────────────┘');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

fixAllAdvisors();
