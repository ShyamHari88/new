import Marks from '../models/Marks.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

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

        // Notify students
        try {
            // Get unique student IDs from the uploaded marks
            const studentIds = [...new Set(marks.map(m => m.studentId))];

            // Find users corresponding to these student IDs
            const users = await User.find({ studentId: { $in: studentIds } });

            // Create notifications
            const notifications = [];

            for (const mark of marks) {
                const user = users.find(u => u.studentId === mark.studentId);
                if (user) {
                    notifications.push({
                        userId: user.userId,
                        title: 'New Marks Uploaded',
                        message: `Marks for ${mark.subjectName} (${mark.assessmentType}) have been uploaded.`,
                        type: 'mark_alert',
                        senderId: req.user?.userId || 'system'
                    });
                }
            }

            if (notifications.length > 0) {
                await Notification.insertMany(notifications);
            }
        } catch (notifError) {
            console.error('Error creating notifications for marks:', notifError);
            // Don't fail the request if notifications fail
        }

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

        // Notify student
        try {
            const user = await User.findOne({ studentId: updatedMark.studentId });
            if (user) {
                await Notification.create({
                    userId: user.userId,
                    title: 'Marks Updated',
                    message: `Your marks for ${updatedMark.subjectName} (${updatedMark.assessmentType}) have been updated to ${marks}.`,
                    type: 'mark_alert',
                    senderId: req.user?.userId || 'system'
                });
            }
        } catch (notifError) {
            console.error('Error creating notification for mark update:', notifError);
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
