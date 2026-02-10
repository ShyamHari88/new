
import User from '../models/User.js';

// Get all teachers
export const getAllTeachers = async (req, res) => {
    try {
        const teachers = await User.find({ role: 'teacher' }).select('-password').sort({ createdAt: -1 });
        res.json({ success: true, teachers });
    } catch (error) {
        console.error('Get teachers error:', error);
        res.status(500).json({ message: 'Error fetching teachers', error: error.message });
    }
};

// Update teacher
export const updateTeacher = async (req, res) => {
    try {
        const { id } = req.params; // teacherId
        const { name, email, departmentId } = req.body;

        const teacher = await User.findOneAndUpdate(
            { teacherId: id, role: 'teacher' },
            { name, email, departmentId },
            { new: true }
        ).select('-password');

        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }

        res.json({ success: true, message: 'Teacher updated successfully', teacher });
    } catch (error) {
        console.error('Update teacher error:', error);
        res.status(500).json({ message: 'Error updating teacher', error: error.message });
    }
};

// Delete teacher
export const deleteTeacher = async (req, res) => {
    try {
        const { id } = req.params; // teacherId

        const teacher = await User.findOneAndDelete({ teacherId: id, role: 'teacher' });

        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }

        res.json({ success: true, message: 'Teacher deleted successfully' });
    } catch (error) {
        console.error('Delete teacher error:', error);
        res.status(500).json({ message: 'Error deleting teacher', error: error.message });
    }
};
