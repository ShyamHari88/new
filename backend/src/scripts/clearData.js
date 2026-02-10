// Clear Sample Data Script
// This removes all sample data but keeps the database structure ready

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function clearSampleData() {
    try {
        console.log('🗑️  Clearing Sample Data from MongoDB...\n');
        console.log('='.repeat(60));

        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas\n');

        const db = mongoose.connection.db;

        // Clear all collections
        console.log('Clearing collections...\n');

        await db.collection('students').deleteMany({});
        console.log('✅ Cleared students');

        await db.collection('users').deleteMany({});
        console.log('✅ Cleared users');

        await db.collection('attendancerecords').deleteMany({});
        console.log('✅ Cleared attendance records');

        await db.collection('attendancesessions').deleteMany({});
        console.log('✅ Cleared attendance sessions');

        await db.collection('marks').deleteMany({});
        console.log('✅ Cleared marks');

        await db.collection('subjects').deleteMany({});
        console.log('✅ Cleared subjects');

        // Keep departments as they are reference data
        console.log('\n📁 Keeping departments (reference data)');

        // Verify counts
        console.log('\n📊 Final Document Counts:');
        const deptCount = await db.collection('departments').countDocuments();
        const userCount = await db.collection('users').countDocuments();
        const studentCount = await db.collection('students').countDocuments();
        const subjectCount = await db.collection('subjects').countDocuments();
        const sessionCount = await db.collection('attendancesessions').countDocuments();
        const recordCount = await db.collection('attendancerecords').countDocuments();
        const markCount = await db.collection('marks').countDocuments();

        console.log(`   Departments: ${deptCount}`);
        console.log(`   Users: ${userCount}`);
        console.log(`   Students: ${studentCount}`);
        console.log(`   Subjects: ${subjectCount}`);
        console.log(`   Attendance Sessions: ${sessionCount}`);
        console.log(`   Attendance Records: ${recordCount}`);
        console.log(`   Marks: ${markCount}`);

        console.log('\n' + '='.repeat(60));
        console.log('\n✅ Sample data cleared successfully!');
        console.log('\n📝 Next steps:');
        console.log('   1. Open your website: http://localhost:8080');
        console.log('   2. Add students through the website');
        console.log('   3. Add teachers/users as needed');
        console.log('   4. All data will be stored in MongoDB!\n');

    } catch (error) {
        console.error('\n❌ Error clearing data:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Connection closed\n');
    }
}

clearSampleData();
