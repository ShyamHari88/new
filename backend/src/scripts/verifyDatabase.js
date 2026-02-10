// Verify Database Status Script
// Quick check to see current document counts in MongoDB

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function verifyDatabaseStatus() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB\n');

        const db = mongoose.connection.db;

        console.log('Current Database Status:');
        console.log('========================\n');

        const collections = [
            'users',
            'students',
            'attendancerecords',
            'attendancesessions',
            'marks',
            'subjects',
            'departments'
        ];

        for (const collection of collections) {
            try {
                const count = await db.collection(collection).countDocuments();
                console.log(`${collection.padEnd(25)}: ${count}`);
            } catch (error) {
                console.log(`${collection.padEnd(25)}: Collection not found`);
            }
        }

        console.log('\n========================\n');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.connection.close();
    }
}

verifyDatabaseStatus();
