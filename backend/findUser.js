import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const findUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({
            $or: [
                { email: /admin26/i },
                { rollNumber: /admin26/i },
                { teacherId: /admin26/i },
                { advisorId: /admin26/i }
            ]
        });

        if (user) {
            console.log('EMAIL:', user.email);
            console.log('ROLE:', user.role);
            console.log('NAME:', user.name);
        } else {
            console.log('NOT FOUND');
        }
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
};

findUser();
