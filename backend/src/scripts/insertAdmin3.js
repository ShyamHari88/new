import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import User from '../models/User.js';

const insertAdmins = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const admins = [
            { email: 'admin@college.edu', id: 'admin-002', name: 'System Admin 2' },
            { email: 'mail-admin@college.edu', id: 'admin-003', name: 'System Admin 3' },
            { email: 'admin', id: 'admin-004', name: 'System Admin 4' } // sometimes users try just 'admin'
        ];

        for (const admin of admins) {
            const { email, id, name } = admin;
            const password = 'admin88';

            let adminUser = await User.findOne({ email });

            if (adminUser) {
                console.log(`Admin user ${email} already exists. Updating password...`);
                // we explicitly update password
                adminUser.password = password; // pre-save hook will hash it
                if (!adminUser.role) adminUser.role = 'admin';
                await adminUser.save();
                console.log(`Admin password updated successfully for ${email}.`);
            } else {
                console.log(`Creating new Admin user ${email}...`);
                adminUser = new User({
                    userId: id,
                    name: name,
                    email: email,
                    password: password, // pre-save hook will hash it
                    role: 'admin',
                    isActive: true,
                    isApproved: true,
                    isFirstLogin: false
                });
                await adminUser.save();
                console.log(`Admin user ${email} created successfully.`);
            }
        }

        mongoose.connection.close();
        console.log('Done.');
    } catch (err) {
        console.error('Error inserting admin:', err);
        mongoose.connection.close();
    }
};

insertAdmins();
