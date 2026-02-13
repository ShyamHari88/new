import Subject from '../models/Subject.js';
import crypto from 'crypto';

// Get all subjects
export const getAllSubjects = async (req, res) => {
    try {
        const { departmentId, year, semester } = req.query;
        let teacherId = req.query.teacherId;

        // If teacher, force filter by their ID
        if (req.user.role === 'teacher') {
            teacherId = req.user.userId;
        }

        const filter = {};
        if (departmentId) filter.departmentId = departmentId;
        if (year) filter.year = parseInt(year);
        if (semester) filter.semester = parseInt(semester);
        if (teacherId) filter.teacherId = teacherId;

        const subjects = await Subject.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, subjects });
    } catch (error) {
        console.error('Get subjects error:', error);
        res.status(500).json({ message: 'Error fetching subjects', error: error.message });
    }
};

// Add new subject
export const addSubject = async (req, res) => {
    try {
        const { name, code, departmentId, year, semester, teacherId, credits } = req.body;

        // Validation
        if (!name || !code || !departmentId || !year || !semester || !teacherId) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Check for duplicate subject
        const existingSubject = await Subject.findOne({
            name: { $regex: new RegExp(`^${name}$`, 'i') },
            departmentId,
            year: parseInt(year),
            semester: parseInt(semester)
        });

        if (existingSubject) {
            return res.status(400).json({
                message: `Subject "${name}" already exists for this class and semester`
            });
        }

        // Create robust random hex ID for subject
        const subjectId = `subject-${crypto.randomBytes(16).toString('hex')}`;

        // Create subject
        const subject = await Subject.create({
            subjectId,
            name,
            code,
            departmentId,
            year: parseInt(year),
            semester: parseInt(semester),
            teacherId,
            credits: credits || 3
        });

        res.status(201).json({
            success: true,
            message: 'Subject added successfully',
            subject
        });
    } catch (error) {
        console.error('Add subject error:', error);
        res.status(500).json({ message: 'Error adding subject', error: error.message });
    }
};

// Update subject
export const updateSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, departmentId, year, semester, teacherId, credits } = req.body;

        const subject = await Subject.findOneAndUpdate(
            { subjectId: id },
            { name, code, departmentId, year, semester, teacherId, credits },
            { new: true }
        );

        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        res.json({ success: true, message: 'Subject updated successfully', subject });
    } catch (error) {
        console.error('Update subject error:', error);
        res.status(500).json({ message: 'Error updating subject', error: error.message });
    }
};

// Delete subject
export const deleteSubject = async (req, res) => {
    try {
        const { id } = req.params;

        const subject = await Subject.findOneAndDelete({ subjectId: id });

        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        res.json({ success: true, message: 'Subject deleted successfully' });
    } catch (error) {
        console.error('Delete subject error:', error);
        res.status(500).json({ message: 'Error deleting subject', error: error.message });
    }
};

// Get subjects by teacher
export const getTeacherSubjects = async (req, res) => {
    try {
        const { teacherId } = req.params;

        const subjects = await Subject.find({ teacherId }).sort({ createdAt: -1 });

        res.json({ success: true, subjects });
    } catch (error) {
        console.error('Get teacher subjects error:', error);
        res.status(500).json({ message: 'Error fetching teacher subjects', error: error.message });
    }
};
