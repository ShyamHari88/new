import mongoose from 'mongoose';

const marksSchema = new mongoose.Schema({
    markId: { type: String, required: true, unique: true },
    studentId: { type: String, required: true },
    rollNumber: { type: String, required: true },
    subjectId: { type: String, required: true },
    subjectName: { type: String, required: true },
    assessmentType: {
        type: String,
        enum: ['CIA_T1', 'CIA_T2', 'CIA_T3', 'SEMESTER'],
        required: true
    },
    marks: { type: Number, required: true, min: 0, max: 100 },
    maxMarks: { type: Number, default: 100 },
    departmentId: { type: String, required: true },
    year: { type: Number, required: true },
    section: { type: String, required: true },
    semester: { type: Number },
    teacherId: { type: String }
}, { timestamps: true });

// Index for faster queries
marksSchema.index({ studentId: 1, subjectName: 1, assessmentType: 1 });

export default mongoose.model('Marks', marksSchema);
