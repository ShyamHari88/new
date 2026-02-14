import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
    assignmentId: { type: String, required: true, unique: true },
    subjectId: { type: String, required: true },
    teacherId: { type: String, required: true },
    department: { type: String, required: true },
    section: { type: String, required: true }
}, { timestamps: true });

// Prevent duplicate subject + section assignment
assignmentSchema.index({ subjectId: 1, section: 1 }, { unique: true });

// Index for faster queries
assignmentSchema.index({ department: 1, section: 1 });
assignmentSchema.index({ teacherId: 1 });

export default mongoose.model('Assignment', assignmentSchema);
