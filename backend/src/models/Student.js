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
    isApproved: { type: Boolean, default: false },
    cgpa: { type: Number, default: 0 },
    semesterResults: [{
        semester: { type: Number, required: true },
        sgpa: { type: Number, required: true },
        credits: { type: Number } // Optional: to calculate CGPA if needed
    }]
}, { timestamps: true });

export default mongoose.model('Student', studentSchema);
