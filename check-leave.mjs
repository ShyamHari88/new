import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env from backend dir
dotenv.config({ path: '../backend/.env' });

async function check() {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI not found in env');
            return;
        }
        await mongoose.connect(process.env.MONGODB_URI);
        const leaves = await mongoose.connection.collection('leaverequests').find({}).sort({ appliedOn: -1 }).limit(5).toArray();
        console.log(JSON.stringify(leaves, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

check();
