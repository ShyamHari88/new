import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import User from '../models/User.js';

const checkRole = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const email = 'admin@college.edu';
        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found at all!');
        } else {
            console.log('User found! Role is:', user.role);

            // if it's not admin, let's fix it right here
            if (user.role !== 'admin') {
                console.log('Changing role to admin...');
                user.role = 'admin';
                await user.save();
                console.log('Role updated to admin!');
            }
        }

        mongoose.connection.close();
    } catch (err) {
        console.error('Error:', err);
    }
};

checkRole();
