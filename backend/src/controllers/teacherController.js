
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
// Create new teacher (Admin only)
export const createTeacher = async (req, res) => {
    try {
        const { name, email, teacherId, password, departmentId } = req.body;

        // Check if teacher already exists
        const existingTeacher = await User.findOne({
            $or: [{ email }, { teacherId }]
        });

        if (existingTeacher) {
            return res.status(400).json({ message: 'Teacher with this email or ID already exists' });
        }

        // Create new user with teacher role
        const teacher = await User.create({
            userId: teacherId, // Using teacherId as userId for consistency
            name,
            email,
            password, // Will be hashed by pre-save hook
            role: 'teacher',
            teacherId,
            departmentId,
            isFirstLogin: true
        });

        res.status(201).json({
            success: true,
            message: 'Teacher created successfully',
            teacher: {
                id: teacher.userId,
                name: teacher.name,
                email: teacher.email,
                teacherId: teacher.teacherId,
                departmentId: teacher.departmentId
            }
        });
    } catch (error) {
        console.error('Create teacher error:', error);
        res.status(500).json({ message: 'Error creating teacher', error: error.message });
    }
};
