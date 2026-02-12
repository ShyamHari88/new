import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import User from '../models/User.js';

const createAdmin = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined');
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const adminData = {
            userId: 'admin26',
            name: 'Super Admin',
            email: 'admin26', // Using 'admin26' as the identifier/email
            password: 'admin26',
            role: 'admin'
        };

        // Check if exists
        const existingAdmin = await User.findOne({ email: adminData.email });
        if (existingAdmin) {
            console.log('Admin already exists. Updating password...');
            existingAdmin.password = adminData.password;
            await existingAdmin.save();
            console.log('Admin password updated.');
        } else {
            console.log('Creating new admin...');
            await User.create(adminData);
            console.log('Admin created successfully.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

createAdmin();
