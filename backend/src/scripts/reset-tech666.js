import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function resetTech666() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.');

        const db = mongoose.connection.db;
        const users = db.collection('users');

        const hashedPassword = await bcrypt.hash('teacher123', 10);

        const result = await users.updateOne(
            { teacherId: 'tech666' },
            {
                $set: {
                    password: hashedPassword,
                    isActive: true,
                    role: 'teacher',
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );

        if (result.upsertedCount > 0) {
            console.log('User tech666 created with password: teacher123');
        } else {
            console.log('User tech666 password reset to: teacher123');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

resetTech666();
