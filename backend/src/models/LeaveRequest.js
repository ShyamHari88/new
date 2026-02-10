import mongoose from 'mongoose';

const leaveRequestSchema = new mongoose.Schema({
    requestId: { type: String, required: true, unique: true },
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    rollNumber: { type: String, required: true },
    type: { type: String, enum: ['Medical', 'On-Duty', 'Personal'], required: true },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    appliedOn: { type: Date, default: Date.now },
    attachments: [{
        name: String,
        size: Number,
        type: String,
        path: String, // Path to file on server
        url: String   // Public URL
    }]
}, { timestamps: true });

export default mongoose.model('LeaveRequest', leaveRequestSchema);
