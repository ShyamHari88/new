import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function checkTeacher() {
    try {
        await mongoose.connect(MONGODB_URI);
        const user = await mongoose.connection.db.collection('users').findOne({ $or: [{ username: 'tech666' }, { email: 'tech666' }] });
        if (user) {
            console.log('✅ User found:', JSON.stringify(user, null, 2));
        } else {
            console.log('❌ User tech666 not found');
            const allTeachers = await mongoose.connection.db.collection('users').find({ role: 'teacher' }).limit(5).toArray();
            console.log('Sample teachers:', allTeachers.map(t => t.username || t.email));
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

checkTeacher();
