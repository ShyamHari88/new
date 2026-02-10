// MongoDB Verification Script
// This script checks if MongoDB is working correctly and displays all data

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function verifyMongoDB() {
    try {
        console.log('🔍 MongoDB Verification Test\n');
        console.log('='.repeat(60));

        // Connect to MongoDB
        console.log('\n1️⃣ Testing Connection...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas');
        console.log(`   Host: ${mongoose.connection.host}`);
        console.log(`   Database: ${mongoose.connection.name}`);

        const db = mongoose.connection.db;

        // Check collections
        console.log('\n2️⃣ Checking Collections...');
        const collections = await db.listCollections().toArray();
        console.log(`✅ Found ${collections.length} collections:`);
        collections.forEach(col => console.log(`   - ${col.name}`));

        // Count documents in each collection
        console.log('\n3️⃣ Counting Documents...\n');

        const departments = await db.collection('departments').countDocuments();
        console.log(`   📁 Departments: ${departments} documents`);

        const users = await db.collection('users').countDocuments();
        console.log(`   👤 Users: ${users} documents`);

        const students = await db.collection('students').countDocuments();
        console.log(`   👨‍🎓 Students: ${students} documents`);

        const subjects = await db.collection('subjects').countDocuments();
        console.log(`   📚 Subjects: ${subjects} documents`);

        const sessions = await db.collection('attendancesessions').countDocuments();
        console.log(`   📅 Attendance Sessions: ${sessions} documents`);

        const records = await db.collection('attendancerecords').countDocuments();
        console.log(`   ✅ Attendance Records: ${records} documents`);

        const marks = await db.collection('marks').countDocuments();
        console.log(`   📝 Marks: ${marks} documents`);

        const total = departments + users + students + subjects + sessions + records + marks;
        console.log(`\n   📊 TOTAL: ${total} documents`);

        // Sample data from each collection
        console.log('\n4️⃣ Sample Data Preview...\n');

        // Show departments
        const deptSample = await db.collection('departments').find().limit(2).toArray();
        console.log('   📁 Departments Sample:');
        deptSample.forEach(d => console.log(`      - ${d.name} (${d.code})`));

        // Show users
        const userSample = await db.collection('users').find().limit(3).toArray();
        console.log('\n   👤 Users Sample:');
        userSample.forEach(u => console.log(`      - ${u.name} (${u.role}) - ${u.email}`));

        // Show students
        const studentSample = await db.collection('students').find().limit(3).toArray();
        console.log('\n   👨‍🎓 Students Sample:');
        studentSample.forEach(s => console.log(`      - ${s.name} (${s.rollNumber}) - Year ${s.year}, Section ${s.section}`));

        // Show subjects
        const subjectSample = await db.collection('subjects').find().limit(3).toArray();
        console.log('\n   📚 Subjects Sample:');
        subjectSample.forEach(s => console.log(`      - ${s.name} (${s.code})`));

        // Show attendance sessions
        const sessionSample = await db.collection('attendancesessions').find().limit(2).toArray();
        console.log('\n   📅 Attendance Sessions Sample:');
        sessionSample.forEach(s => console.log(`      - ${s.subject}, Period ${s.period}, ${s.date} (${s.presentCount}/${s.totalStudents} present)`));

        // Show marks
        const marksSample = await db.collection('marks').find().limit(3).toArray();
        console.log('\n   📝 Marks Sample:');
        marksSample.forEach(m => console.log(`      - ${m.subject}: ${m.marks}/${m.maxMarks} (${m.assessmentType})`));

        // Test queries
        console.log('\n5️⃣ Testing Queries...\n');

        // Find a specific student
        const tamil = await db.collection('students').findOne({ rollNumber: '23IT151' });
        console.log(`   ✅ Found student: ${tamil.name} (${tamil.rollNumber})`);

        // Find attendance for Tamil
        const tamilAttendance = await db.collection('attendancerecords').find({ studentId: tamil.studentId }).toArray();
        console.log(`   ✅ Found ${tamilAttendance.length} attendance records for ${tamil.name}`);

        // Find marks for Tamil
        const tamilMarks = await db.collection('marks').find({ studentId: tamil.studentId }).toArray();
        console.log(`   ✅ Found ${tamilMarks.length} marks records for ${tamil.name}`);

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('\n✅ MongoDB Verification PASSED!');
        console.log('\n📊 Summary:');
        console.log(`   - Connection: ✅ Working`);
        console.log(`   - Collections: ✅ ${collections.length} found`);
        console.log(`   - Documents: ✅ ${total} total`);
        console.log(`   - Queries: ✅ Working`);
        console.log('\n🎉 Your MongoDB database is working perfectly!\n');

    } catch (error) {
        console.error('\n❌ MongoDB Verification FAILED!');
        console.error('Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Connection closed\n');
    }
}

verifyMongoDB();
