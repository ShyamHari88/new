import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import User from '../models/User.js';

const listUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({}, 'name email role');
        console.log('All Users in DB:');
        console.table(users.map(u => ({ email: u.email, role: u.role, name: u.name })));
        mongoose.connection.close();
    } catch (err) {
        console.error('Error:', err);
    }
};

listUsers();
