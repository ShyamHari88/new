
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function checkAttendance() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const attendanceRecords = await db.collection('attendancerecords').find({}).toArray();

        console.log(`Total attendance records: ${attendanceRecords.length}`);

        const missingSemester = attendanceRecords.filter(r => !r.semester);
        const missingStudentId = attendanceRecords.filter(r => !r.studentId);
        const missingSubjectName = attendanceRecords.filter(r => !r.subjectName);
        const sampleStudentIds = attendanceRecords.filter(r => r.studentId && r.studentId.startsWith('sample-student-'));

        console.log(`- Records missing semester: ${missingSemester.length}`);
        console.log(`- Records missing studentId: ${missingStudentId.length}`);
        console.log(`- Records missing subjectName: ${missingSubjectName.length}`);
        console.log(`- Records with sample-student-X IDs: ${sampleStudentIds.length}`);

        if (missingSemester.length > 0) {
            console.log('\nSample records missing semester:');
            console.log(missingSemester.slice(0, 3).map(r => ({
                _id: r._id,
                studentId: r.studentId,
                subject: r.subject,
                subjectName: r.subjectName,
                date: r.date
            })));
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('Check failed:', error);
    }
}

checkAttendance();
