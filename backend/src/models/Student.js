import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
    studentId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    rollNumber: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    departmentId: { type: String, required: true },
    year: { type: Number, required: true, min: 1, max: 4 },
    section: { type: String, required: true },
    currentSemester: { type: Number, required: true, min: 1, max: 8 },
}, { timestamps: true });

export default mongoose.model('Student', studentSchema);
