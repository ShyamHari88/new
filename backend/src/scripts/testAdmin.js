import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import User from '../models/User.js';

const testAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const email = 'admin@college.edu';
        const user = await User.findOne({ email, role: 'admin' });
        if (!user) {
            console.log('User not found!');
        } else {
            console.log('User found! Hashed password in DB:', user.password);
            const isMatch = await user.comparePassword('admin88');
            console.log('Does "admin88" match?', isMatch);
        }

        mongoose.connection.close();
    } catch (err) {
        console.error('Error:', err);
    }
};

testAdmin();
