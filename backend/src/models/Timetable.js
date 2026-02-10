
import mongoose from 'mongoose';

const timetableSchema = new mongoose.Schema({
    departmentId: { type: String, required: true },
    year: { type: Number, required: true },
    section: { type: String, required: true },
    day: {
        type: String,
        required: true,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    periods: [{
        periodNumber: { type: Number, required: true },
        subject: { type: String, required: true },
        teacherId: { type: String }, // Optional, link to teacher
        startTime: { type: String, required: true }, // e.g., "09:00"
        endTime: { type: String, required: true }   // e.g., "10:00"
    }]
}, {
    timestamps: true,
    // Ensure unique timetable for a specific class on a specific day
    indexes: [
        { unique: true, fields: ['departmentId', 'year', 'section', 'day'] }
    ]
});

export default mongoose.model('Timetable', timetableSchema);
