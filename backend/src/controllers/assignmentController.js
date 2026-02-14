import Assignment from '../models/Assignment.js';
import crypto from 'crypto';

// Get all assignments
export const getAllAssignments = async (req, res) => {
    try {
        const { department, section, subjectId, teacherId } = req.query;
        const filter = {};
        if (department) filter.department = department;
        if (section) filter.section = section;
        if (subjectId) filter.subjectId = subjectId;
        if (teacherId) filter.teacherId = teacherId;

        const assignments = await Assignment.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, assignments });
    } catch (error) {
        console.error('Get assignments error:', error);
        res.status(500).json({ message: 'Error fetching assignments', error: error.message });
    }
};

// Create or update assignment
export const createAssignment = async (req, res) => {
    try {
        const { subjectId, teacherId, department, section } = req.body;

        if (!subjectId || !teacherId || !department || !section) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Check for duplicate subject + section assignment
        const existing = await Assignment.findOne({ subjectId, section });
        if (existing) {
            return res.status(400).json({
                message: `Section ${section} is already assigned a faculty for this subject.`
            });
        }

        const assignmentId = `asgn-${crypto.randomBytes(8).toString('hex')}`;
        const assignment = await Assignment.create({
            assignmentId,
            subjectId,
            teacherId,
            department,
            section
        });

        res.status(201).json({
            success: true,
            message: 'Faculty assigned successfully to section',
            assignment
        });
    } catch (error) {
        console.error('Create assignment error:', error);
        res.status(500).json({ message: 'Error assigning faculty', error: error.message });
    }
};

// Delete assignment
export const deleteAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const assignment = await Assignment.findOneAndDelete({ assignmentId: id });

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        res.json({ success: true, message: 'Assignment removed successfully' });
    } catch (error) {
        console.error('Delete assignment error:', error);
        res.status(500).json({ message: 'Error deleting assignment', error: error.message });
    }
};
