
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';
import Student from './models/Student.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const fixStudents = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Assuming the advisor is Dept '1' Section 'C' (as per "Test Advisor")
        const advisorDept = '1';
        const advisorSection = 'C';

        // Find students who are in Year 3 but might be pending or have wrong dept ID
        // Often 'IT' vs '1' mismatch happens.
        // Or simply unapproved.

        // Fix 1: Update Approval Status for Year 3 Section C
        const updateResult = await Student.updateMany(
            {
                section: advisorSection,
                year: 3
                // We'll broaden the dept check or update it
            },
            {
                $set: {
                    isApproved: true,
                    departmentId: advisorDept
                }
            }
        );
        console.log(`Updated Student Profiles (Approve + Fix Dept): ${updateResult.modifiedCount}`);

        // Fix 2: Sync User accounts for these students
        // Find the students we just updated to get their studentIds or emails
        const students = await Student.find({ section: advisorSection, year: 3 });
        const studentEmails = students.map(s => s.email);

        const userUpdateResult = await User.updateMany(
            {
                email: { $in: studentEmails },
                role: 'student'
            },
            {
                $set: {
                    isApproved: true,
                    departmentId: advisorDept,
                    section: advisorSection
                }
            }
        );
        console.log(`Updated User Accounts (Approve + Fix Dept): ${userUpdateResult.modifiedCount}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

fixStudents();
