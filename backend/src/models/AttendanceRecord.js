import mongoose from 'mongoose';

const attendanceRecordSchema = new mongoose.Schema({
    recordId: { type: String, required: true, unique: true },
    studentId: { type: String, required: true },
    rollNumber: { type: String, required: true },
    subjectId: { type: String, required: true },
    subjectName: { type: String, required: true },
    date: { type: Date, required: true },
    period: { type: Number, required: true },
    status: { type: String, enum: ['present', 'absent', 'od'], required: true },
    departmentId: { type: String, required: true },
    year: { type: Number, required: true },
    section: { type: String, required: true },
    semester: { type: Number },
    teacherId: { type: String },
    topicCovered: { type: String }
}, { timestamps: true });

// Index for faster queries
attendanceRecordSchema.index({ studentId: 1, subjectName: 1 });
attendanceRecordSchema.index({ date: 1, period: 1 });

export default mongoose.model('AttendanceRecord', attendanceRecordSchema);
