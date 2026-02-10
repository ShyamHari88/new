// Comprehensive Student Data Generation Script
// Generates 30 students (15 boys + 15 girls) per section for all departments and years
// Usage: node src/scripts/seedComprehensiveData.js

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

// Department configurations
const departments = [
    { departmentId: '1', name: 'Information Technology', code: 'IT' },
    { departmentId: '2', name: 'Computer Science', code: 'CSE' },
    { departmentId: '3', name: 'Electronics and Communication', code: 'ECE' },
    { departmentId: '4', name: 'Mechanical Engineering', code: 'MECH' }
];

// Sample names for students
const boysNames = [
    'Aarav Kumar', 'Arjun Sharma', 'Aditya Patel', 'Rohan Gupta', 'Karan Singh',
    'Vikram Reddy', 'Rahul Verma', 'Aryan Joshi', 'Siddharth Nair', 'Varun Iyer',
    'Pranav Desai', 'Nikhil Rao', 'Harsh Mehta', 'Akash Pillai', 'Yash Menon'
];

const girlsNames = [
    'Ananya Sharma', 'Priya Patel', 'Diya Kumar', 'Ishita Gupta', 'Kavya Singh',
    'Sneha Reddy', 'Riya Verma', 'Aisha Joshi', 'Tanvi Nair', 'Pooja Iyer',
    'Meera Desai', 'Nisha Rao', 'Simran Mehta', 'Aditi Pillai', 'Shruti Menon'
];

// Generate email from name
function generateEmail(name, rollNumber) {
    const cleanName = name.toLowerCase().replace(/\s+/g, '.');
    return `${cleanName}.${rollNumber.toLowerCase()}@college.edu`;
}

// Generate all students, users, and credentials
function generateComprehensiveData() {
    const allStudents = [];
    const allUsers = [];
    const credentials = [];

    let studentCounter = 1;
    let userCounter = 1;

    // Add admin and teachers first
    allUsers.push({
        userId: 'admin-1',
        name: 'System Administrator',
        email: 'admin@college.edu',
        password: 'admin123',
        role: 'admin',
        departmentId: '1',
        createdAt: new Date(),
        updatedAt: new Date()
    });

    credentials.push({
        category: 'ADMIN',
        name: 'System Administrator',
        username: 'admin@college.edu',
        password: 'admin123',
        id: 'admin-1',
        role: 'admin'
    });

    // Add teachers for each department
    departments.forEach((dept, idx) => {
        const teacherId = `teacher-${idx + 1}`;
        allUsers.push({
            userId: teacherId,
            name: `Dr. ${dept.code} Faculty`,
            email: `teacher.${dept.code.toLowerCase()}@college.edu`,
            password: 'teacher123',
            role: 'teacher',
            teacherId: teacherId, // Add teacherId field for login
            departmentId: dept.departmentId,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        credentials.push({
            category: `TEACHER - ${dept.name}`,
            name: `Dr. ${dept.code} Faculty`,
            username: `teacher.${dept.code.toLowerCase()}@college.edu`,
            password: 'teacher123',
            id: teacherId,
            role: 'teacher'
        });
    });

    // Generate students for each department, year, and section
    departments.forEach(dept => {
        for (let year = 1; year <= 4; year++) {
            const sections = ['A', 'B', 'C'];

            sections.forEach(section => {
                // Add 15 boys
                for (let i = 0; i < 15; i++) {
                    const rollNum = `${24 - year}${dept.code}${(section.charCodeAt(0) - 64) * 100 + i + 1}`.padEnd(7, '0');
                    const studentId = `student-${studentCounter++}`;
                    const userId = `user-${userCounter++}`;
                    const name = boysNames[i];
                    const email = generateEmail(name, rollNum);
                    const password = rollNum; // Roll number as password

                    // Student record
                    allStudents.push({
                        studentId,
                        name,
                        rollNumber: rollNum,
                        email,
                        departmentId: dept.departmentId,
                        year,
                        section,
                        currentSemester: (year * 2) - 1,
                        gender: 'Male',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });

                    // User record
                    allUsers.push({
                        userId,
                        name,
                        email,
                        password,
                        role: 'student',
                        rollNumber: rollNum,
                        departmentId: dept.departmentId,
                        studentId,
                        year,
                        section,
                        currentSemester: (year * 2) - 1,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });

                    // Credentials
                    credentials.push({
                        category: `${dept.code} - Year ${year} - Section ${section}`,
                        name,
                        username: email,
                        password: rollNum,
                        id: rollNum,
                        role: 'student',
                        gender: 'Male'
                    });
                }

                // Add 15 girls
                for (let i = 0; i < 15; i++) {
                    const rollNum = `${24 - year}${dept.code}${(section.charCodeAt(0) - 64) * 100 + i + 16}`.padEnd(7, '0');
                    const studentId = `student-${studentCounter++}`;
                    const userId = `user-${userCounter++}`;
                    const name = girlsNames[i];
                    const email = generateEmail(name, rollNum);
                    const password = rollNum;

                    // Student record
                    allStudents.push({
                        studentId,
                        name,
                        rollNumber: rollNum,
                        email,
                        departmentId: dept.departmentId,
                        year,
                        section,
                        currentSemester: (year * 2) - 1,
                        gender: 'Female',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });

                    // User record
                    allUsers.push({
                        userId,
                        name,
                        email,
                        password,
                        role: 'student',
                        rollNumber: rollNum,
                        departmentId: dept.departmentId,
                        studentId,
                        year,
                        section,
                        currentSemester: (year * 2) - 1,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });

                    // Credentials
                    credentials.push({
                        category: `${dept.code} - Year ${year} - Section ${section}`,
                        name,
                        username: email,
                        password: rollNum,
                        id: rollNum,
                        role: 'student',
                        gender: 'Female'
                    });
                }
            });
        }
    });

    return { allStudents, allUsers, credentials };
}

// Generate credentials text file
function generateCredentialsFile(credentials) {
    let content = '='.repeat(110) + '\n';
    content += 'CLASS CONNECT - USER CREDENTIALS\n';
    content += 'Generated: ' + new Date().toLocaleString() + '\n';
    content += '='.repeat(110) + '\n\n';

    let currentCategory = '';

    credentials.forEach(cred => {
        if (cred.category !== currentCategory) {
            currentCategory = cred.category;
            content += '\n' + '='.repeat(110) + '\n';
            content += `${currentCategory}\n`;
            content += '='.repeat(110) + '\n';
            content += `${'Name'.padEnd(30)} | ${'ID (Teacher/Student)'.padEnd(20)} | ${'Username/Email'.padEnd(40)} | ${'Password'.padEnd(15)}\n`;
            content += '-'.repeat(110) + '\n';
        }

        const idDisplay = cred.role === 'student' ? `${cred.id} (Student)` : `${cred.id} (${cred.role.charAt(0).toUpperCase() + cred.role.slice(1)})`;
        content += `${cred.name.padEnd(30)} | ${idDisplay.padEnd(20)} | ${cred.username.padEnd(40)} | ${cred.password.padEnd(15)}\n`;
    });

    content += '\n' + '='.repeat(110) + '\n';
    content += 'END OF CREDENTIALS FILE\n';
    content += '='.repeat(110) + '\n';

    return content;
}

// Main seeding function
async function seedComprehensiveData() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas\n');

        console.log('📊 Generating comprehensive student data...');
        const { allStudents, allUsers, credentials } = generateComprehensiveData();

        console.log(`✅ Generated ${allStudents.length} students`);
        console.log(`✅ Generated ${allUsers.length} users`);

        // Hash passwords
        console.log('\n🔐 Hashing passwords...');
        for (let user of allUsers) {
            user.password = await bcrypt.hash(user.password, 10);
        }
        console.log('✅ Passwords hashed');

        // Insert into MongoDB
        console.log('\n📦 Inserting data into MongoDB...\n');
        const db = mongoose.connection.db;

        // Insert departments
        await db.collection('departments').deleteMany({});
        await db.collection('departments').insertMany(departments.map(d => ({
            ...d,
            createdAt: new Date(),
            updatedAt: new Date()
        })));
        console.log(`✅ Inserted ${departments.length} departments`);

        // Insert users
        await db.collection('users').deleteMany({});
        await db.collection('users').insertMany(allUsers);
        console.log(`✅ Inserted ${allUsers.length} users`);

        // Insert students
        await db.collection('students').deleteMany({});
        await db.collection('students').insertMany(allStudents);
        console.log(`✅ Inserted ${allStudents.length} students`);

        // Generate credentials file
        console.log('\n📝 Generating credentials file...');
        const credentialsContent = generateCredentialsFile(credentials);
        const credentialsPath = path.join(process.cwd(), 'user-pass.txt');
        fs.writeFileSync(credentialsPath, credentialsContent, 'utf8');
        console.log(`✅ Credentials file created: ${credentialsPath}`);

        console.log('\n🎉 Comprehensive data seeding completed successfully!\n');
        console.log('📊 Summary:');
        console.log(`   - Departments: ${departments.length}`);
        console.log(`   - Total Users: ${allUsers.length}`);
        console.log(`   - Total Students: ${allStudents.length}`);
        console.log(`   - Students per section: 30 (15 boys + 15 girls)`);
        console.log(`   - Total sections: ${departments.length * 4 * 3} (4 depts × 4 years × 3 sections)`);
        console.log('\n🔑 Admin Login:');
        console.log('   Email: admin@college.edu');
        console.log('   Password: admin123');
        console.log('\n📄 All credentials saved in: user-pass.txt');

    } catch (error) {
        console.error('❌ Error seeding data:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 MongoDB connection closed');
    }
}

// Run the seeding
seedComprehensiveData();
