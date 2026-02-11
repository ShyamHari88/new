
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/class-connect';

async function verifyDatabaseStatus() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;

        console.log('Current Database Counts:');
        console.log('------------------------');

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
                console.log(`${collection.padEnd(20)}: ${count}`);
            } catch (error) {
                console.log(`${collection.padEnd(20)}: Collection empty or not found`);
            }
        }
        console.log('------------------------\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

verifyDatabaseStatus();
