
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function listStudents() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const students = await mongoose.connection.db.collection('students').find({}).toArray();
        console.log(JSON.stringify(students, null, 2));
        await mongoose.connection.close();
    } catch (error) {
        console.error(error);
    }
}

listStudents();
