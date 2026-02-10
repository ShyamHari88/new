// Delete All Login Data Script
// This script completely removes all users and students from MongoDB
// After running this, you can seed new data from scratch
// Usage: node src/scripts/deleteAllLoginData.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function deleteAllLoginData() {
    try {
        console.log('🗑️  DELETING ALL LOGIN DATA FROM MONGODB...\n');
        console.log('='.repeat(70));
        console.log('⚠️  WARNING: This will delete ALL users and students!');
        console.log('='.repeat(70));
        console.log('');

        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas\n');

        const db = mongoose.connection.db;

        // Get counts before deletion
        console.log('📊 Current Document Counts:');
        const userCountBefore = await db.collection('users').countDocuments();
        const studentCountBefore = await db.collection('students').countDocuments();
        const attendanceRecordsBefore = await db.collection('attendancerecords').countDocuments();
        const attendanceSessionsBefore = await db.collection('attendancesessions').countDocuments();
        const marksBefore = await db.collection('marks').countDocuments();
        const subjectsBefore = await db.collection('subjects').countDocuments();

        console.log(`   Users: ${userCountBefore}`);
        console.log(`   Students: ${studentCountBefore}`);
        console.log(`   Attendance Records: ${attendanceRecordsBefore}`);
        console.log(`   Attendance Sessions: ${attendanceSessionsBefore}`);
        console.log(`   Marks: ${marksBefore}`);
        console.log(`   Subjects: ${subjectsBefore}`);
        console.log('');

        // Delete all collections related to users and students
        console.log('🗑️  Deleting all data...\n');

        // Delete users (this includes admin, teachers, and students)
        await db.collection('users').deleteMany({});
        console.log('✅ Deleted all users (admin, teachers, students)');

        // Delete students
        await db.collection('students').deleteMany({});
        console.log('✅ Deleted all student records');

        // Delete attendance records
        await db.collection('attendancerecords').deleteMany({});
        console.log('✅ Deleted all attendance records');

        // Delete attendance sessions
        await db.collection('attendancesessions').deleteMany({});
        console.log('✅ Deleted all attendance sessions');

        // Delete marks
        await db.collection('marks').deleteMany({});
        console.log('✅ Deleted all marks');

        // Delete subjects
        await db.collection('subjects').deleteMany({});
        console.log('✅ Deleted all subjects');

        // Delete leave requests if they exist
        try {
            await db.collection('leaverequests').deleteMany({});
            console.log('✅ Deleted all leave requests');
        } catch (error) {
            // Collection might not exist, that's okay
        }

        // Verify deletion
        console.log('\n📊 Final Document Counts:');
        const userCountAfter = await db.collection('users').countDocuments();
        const studentCountAfter = await db.collection('students').countDocuments();
        const attendanceRecordsAfter = await db.collection('attendancerecords').countDocuments();
        const attendanceSessionsAfter = await db.collection('attendancesessions').countDocuments();
        const marksAfter = await db.collection('marks').countDocuments();
        const subjectsAfter = await db.collection('subjects').countDocuments();
        const deptCount = await db.collection('departments').countDocuments();

        console.log(`   Users: ${userCountAfter}`);
        console.log(`   Students: ${studentCountAfter}`);
        console.log(`   Attendance Records: ${attendanceRecordsAfter}`);
        console.log(`   Attendance Sessions: ${attendanceSessionsAfter}`);
        console.log(`   Marks: ${marksAfter}`);
        console.log(`   Subjects: ${subjectsAfter}`);
        console.log(`   Departments: ${deptCount} (kept for reference)`);

        console.log('\n' + '='.repeat(70));
        console.log('✅ ALL LOGIN DATA DELETED SUCCESSFULLY!');
        console.log('='.repeat(70));
        console.log('\n📝 Next Steps:');
        console.log('   1. To seed comprehensive data with all students:');
        console.log('      npm run seed:comprehensive');
        console.log('');
        console.log('   2. To seed basic sample data:');
        console.log('      npm run seed');
        console.log('');
        console.log('   3. Or manually add users through the application');
        console.log('');
        console.log('💡 Note: Department data has been preserved as reference data.');
        console.log('');

    } catch (error) {
        console.error('\n❌ Error deleting data:', error.message);
        console.error(error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed\n');
    }
}

// Run the deletion
deleteAllLoginData();
