import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
    subjectId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    departmentId: { type: String, required: true },
    year: { type: Number, required: true },
    semester: { type: Number, required: true },
    teacherId: { type: String },
    teacherName: { type: String }
}, { timestamps: true });

// Index for faster queries
subjectSchema.index({ departmentId: 1, year: 1, semester: 1 });

export default mongoose.model('Subject', subjectSchema);
