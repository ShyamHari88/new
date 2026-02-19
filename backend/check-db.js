import mongoose from 'mongoose';
import dotenv from 'dotenv';
import LeaveRequest from './src/models/LeaveRequest.js';

dotenv.config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const leaves = await mongoose.connection.collection('leaverequests').find({ rollNumber: '23IT132' }).toArray();
        console.log('--- LEAVE DATA ---');
        console.log(JSON.stringify(leaves, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

check();
