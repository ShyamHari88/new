import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function createTech666() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.');

        const db = mongoose.connection.db;
        const users = db.collection('users');

        // Check if exists
        const existing = await users.findOne({ teacherId: 'tech666' });
        if (existing) {
            console.log('User tech666 already exists.');
        } else {
            const hashedPassword = await bcrypt.hash('teacher123', 10);
            const newUser = {
                userId: `user-tech666-${Date.now()}`,
                name: 'Test Teacher',
                email: 'tech666@college.edu',
                password: hashedPassword,
                role: 'teacher',
                teacherId: 'tech666',
                departmentId: '1', // IT
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            await users.insertOne(newUser);
            console.log('User tech666 created successfully with password: teacher123');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

createTech666();
