import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import User from '../models/User.js';

const fixPasswords = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const teachers = await User.find({ role: 'teacher' });

        for (const t of teachers) {
            if (!t.rawPassword) {
                // Determine sensible default logic or update directly
                let fallback = 'teacher123';
                if (t.email === 'teacher@college.edu') fallback = 'teacher123';
                if (t.email === 'sarah.smith@college.edu') fallback = 'teacher123';
                console.log(`Updating rawPassword for ${t.email} to ${fallback}`);

                // Set the rawPassword, and skip password re-hashing by updating directly or ensuring isModified returns false for password
                const res = await User.updateOne({ _id: t._id }, { $set: { rawPassword: fallback, password: t.password } });
            }
        }

        mongoose.connection.close();
        console.log('Done fixing passwords.');
    } catch (err) {
        console.error('Error fixing passwords:', err);
        mongoose.connection.close();
    }
};

fixPasswords();
