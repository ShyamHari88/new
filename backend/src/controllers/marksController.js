import Marks from '../models/Marks.js';

// Get marks for a student
export const getStudentMarks = async (req, res) => {
    try {
        const { studentId } = req.params;

        const marks = await Marks.find({ studentId }).sort({ createdAt: -1 });

        // Calculate average
        const totalMarks = marks.reduce((sum, m) => sum + m.marks, 0);
        const averageMarks = marks.length > 0 ? Math.round(totalMarks / marks.length) : 0;

        res.json({
            success: true,
            marks,
            averageMarks,
            totalRecords: marks.length
        });
    } catch (error) {
        console.error('Get marks error:', error);
        res.status(500).json({ message: 'Error fetching marks', error: error.message });
    }
};

// Add marks (bulk)
export const addMarks = async (req, res) => {
    try {
        const { marks } = req.body;

        if (!marks || !Array.isArray(marks)) {
            return res.status(400).json({ message: 'Invalid marks format' });
        }

        const createdMarks = await Marks.insertMany(marks);

        res.status(201).json({
            success: true,
            message: 'Marks added successfully',
            count: createdMarks.length
        });
    } catch (error) {
        console.error('Add marks error:', error);
        res.status(500).json({ message: 'Error adding marks', error: error.message });
    }
};

// Get all marks (for teachers)
export const getAllMarks = async (req, res) => {
    try {
        const { departmentId, year, section, subjectName, assessmentType } = req.query;

        const filter = {};
        if (departmentId) filter.departmentId = departmentId;
        if (year) filter.year = parseInt(year);
        if (section) filter.section = section;
        if (subjectName) filter.subjectName = subjectName;
        if (assessmentType) filter.assessmentType = assessmentType;

        const marks = await Marks.find(filter).sort({ createdAt: -1 });

        res.json({ success: true, marks });
    } catch (error) {
        console.error('Get all marks error:', error);
        res.status(500).json({ message: 'Error fetching marks', error: error.message });
    }
};
// Update a mark
export const updateMark = async (req, res) => {
    try {
        const { id } = req.params;
        const { marks } = req.body;

        const updatedMark = await Marks.findOneAndUpdate(
            { markId: id },
            { marks, updatedAt: new Date() },
            { new: true }
        );

        if (!updatedMark) {
            return res.status(404).json({ message: 'Mark not found' });
        }

        res.json({
            success: true,
            message: 'Mark updated successfully',
            mark: updatedMark
        });
    } catch (error) {
        console.error('Update mark error:', error);
        res.status(500).json({ message: 'Error updating mark', error: error.message });
    }
};
