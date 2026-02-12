import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import User from '../models/User.js';
import Student from '../models/Student.js';

const cleanup = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in .env');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected!');

        // Delete all students and users with role 'student'
        console.log('Deleting student users...');
        const userResult = await User.deleteMany({ role: 'student' });
        console.log(`Deleted ${userResult.deletedCount} student users.`);

        console.log('Deleting student records...');
        const studentResult = await Student.deleteMany({});
        console.log(`Deleted ${studentResult.deletedCount} student records.`);

        console.log('Cleanup complete!');
        process.exit(0);
    } catch (error) {
        console.error('Cleanup failed:', error);
        process.exit(1);
    }
};

cleanup();
