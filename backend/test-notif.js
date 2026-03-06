import mongoose from 'mongoose';
import User from './src/models/User.js';
import Notification from './src/models/Notification.js';

async function run() {
    try {
        await mongoose.connect('mongodb+srv://attendance:shyam123@cluster0.08g9j5t.mongodb.net/class-connect?appName=Cluster0');
        console.log("Connected to MongoDB");

        const user = await User.findOne({ email: 'admin@college.edu' });
        if (!user) {
            console.log("Admin user not found.");
            process.exit(1);
        }

        const notif = await Notification.create({
            userId: user.userId || 'admin',
            title: 'System Update',
            message: 'App notification is working successfully. Test from the Antigravity agent.',
            type: 'general',
            isRead: false
        });

        console.log("Notification created successfully:", notif);
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

run();
