import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const checkAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('DB Connected');

        const admin = await User.findOne({ role: 'admin' });
        if (admin) {
            console.log('Admin found:');
            console.log('Email:', admin.email);
            console.log('Name:', admin.name);
        } else {
            console.log('No admin found in DB');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkAdmin();
