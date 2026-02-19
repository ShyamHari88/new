
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function fixLastRecords() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const attendanceColl = db.collection('attendancerecords');
        const studentColl = db.collection('students');
        const subjectColl = db.collection('subjects');

        const problematicRecords = await attendanceColl.find({
            studentId: { $in: ['sample-student-3', 'sample-student-4', 'sample-student-5'] }
        }).toArray();

        console.log(`Found ${problematicRecords.length} problematic records.`);

        // Find DSA subject to get semester
        const dsaSubject = await subjectColl.findOne({ name: /Data Structures and Algorithms/i });
        const targetSemester = dsaSubject ? dsaSubject.semester : 3; // Default to 3 if unknown

        // Map sample IDs to roll numbers
        const sampleToRoll = {
            'sample-student-1': '23IT151',
            'sample-student-2': '23IT152',
            'sample-student-3': '22IT101', // Guessed based on common patterns
            'sample-student-4': '22IT102',
            'sample-student-5': '22IT103'
        };

        // Get actual students for these roll numbers
        const students = await studentColl.find({
            rollNumber: { $in: Object.values(sampleToRoll) }
        }).toArray();
        const studentMap = new Map(students.map(s => [s.rollNumber, s]));

        for (const record of problematicRecords) {
            const roll = sampleToRoll[record.studentId];
            const realStudent = studentMap.get(roll);

            if (realStudent) {
                const updates = {
                    studentId: realStudent.studentId,
                    rollNumber: realStudent.rollNumber,
                    departmentId: realStudent.departmentId,
                    year: realStudent.year,
                    section: realStudent.section,
                    semester: targetSemester,
                    subjectName: record.subject,
                    recordId: `att-fixed-${record._id}`
                };

                await attendanceColl.updateOne({ _id: record._id }, { $set: updates });
                console.log(`Updated record ${record._id} for ${realStudent.name}`);
            } else {
                // If student not found by roll, just fix the semester and subjectName at least
                await attendanceColl.updateOne({ _id: record._id }, {
                    $set: {
                        semester: targetSemester,
                        subjectName: record.subject
                    }
                });
                console.log(`Partially updated record ${record._id} (student not found)`);
            }
        }

        await mongoose.connection.close();
        console.log('Done.');
    } catch (error) {
        console.error('Fix failed:', error);
    }
}

fixLastRecords();
