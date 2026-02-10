
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // Recipient
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
        type: String,
        enum: ['leave_update', 'attendance_alert', 'general', 'mark_alert'],
        default: 'general'
    },
    isRead: { type: Boolean, default: false },
    senderId: { type: String }, // Optional, who sent it
    link: { type: String } // Optional, link to relevant page
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);
