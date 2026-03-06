import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import User from '../models/User.js';

const insertAdmin = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const email = 'admin@college.edu';
        const password = 'admin88';

        let adminUser = await User.findOne({ email });

        if (adminUser) {
            console.log('Admin user already exists. Updating password...');
            adminUser.password = password; // pre-save hook will hash it
            await adminUser.save();
            console.log('Admin password updated successfully.');
        } else {
            console.log('Creating new Admin user...');
            adminUser = new User({
                userId: 'admin-002',
                name: 'System Admin 2',
                email: email,
                password: password, // pre-save hook will hash it
                role: 'admin',
                isActive: true,
                isApproved: true,
                isFirstLogin: false
            });
            await adminUser.save();
            console.log('Admin user created successfully.');
        }

        mongoose.connection.close();
        console.log('Done.');
    } catch (err) {
        console.error('Error inserting admin:', err);
        mongoose.connection.close();
    }
};

insertAdmin();
