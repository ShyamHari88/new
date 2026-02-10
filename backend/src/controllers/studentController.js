import Student from '../models/Student.js';
import User from '../models/User.js';
import crypto from 'crypto';

// Get all students
export const getAllStudents = async (req, res) => {
    try {
        const students = await Student.find().sort({ createdAt: -1 });
        res.json({ success: true, students });
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ message: 'Error fetching students', error: error.message });
    }
};

// Add new student (by teacher)
export const addStudent = async (req, res) => {
    try {
        const { name, email, rollNumber, password, departmentId, year, section, currentSemester } = req.body;

        // Validation
        if (!name || !email || !rollNumber || !password || !departmentId || !year || !section) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Check if student already exists
        const existingStudent = await Student.findOne({ rollNumber });
        if (existingStudent) {
            return res.status(400).json({ message: 'Student with this roll number already exists' });
        }

        // Check if user with email or roll number exists
        const existingUser = await User.findOne({ $or: [{ email }, { rollNumber }] });
        if (existingUser) {
            return res.status(400).json({
                message: existingUser.email === email ? 'Email already registered' : 'Roll number already registered'
            });
        }

        // Create student ID using robust random hex
        const studentId = `student-${crypto.randomBytes(16).toString('hex')}`;
        const userId = `user-${crypto.randomBytes(16).toString('hex')}`;

        // Create student record
        const student = await Student.create({
            studentId,
            name,
            rollNumber,
            email,
            departmentId,
            year: parseInt(year),
            section,
            currentSemester: currentSemester || 1
        });

        // Create user account for the student
        await User.create({
            userId,
            name,
            email,
            password, // Will be hashed by pre-save hook
            role: 'student',
            rollNumber,
            studentId,
            departmentId,
            year: parseInt(year),
            section,
            currentSemester: currentSemester || 1
        });

        res.status(201).json({
            success: true,
            message: 'Student added successfully',
            student
        });
    } catch (error) {
        console.error('Add student error:', error);
        res.status(500).json({ message: 'Error adding student', error: error.message });
    }
};

// Update student
export const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, rollNumber, departmentId, year, section, currentSemester } = req.body;

        const student = await Student.findOneAndUpdate(
            { studentId: id },
            { name, email, rollNumber, departmentId, year, section, currentSemester },
            { new: true }
        );

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Also update user record
        await User.findOneAndUpdate(
            { studentId: id },
            { name, email, rollNumber, departmentId, year, section, currentSemester }
        );

        res.json({ success: true, message: 'Student updated successfully', student });
    } catch (error) {
        console.error('Update student error:', error);
        res.status(500).json({ message: 'Error updating student', error: error.message });
    }
};

// Delete student
export const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;

        const student = await Student.findOneAndDelete({ studentId: id });

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Also delete user account
        await User.findOneAndDelete({ studentId: id });

        res.json({ success: true, message: 'Student deleted successfully' });
    } catch (error) {
        console.error('Delete student error:', error);
        res.status(500).json({ message: 'Error deleting student', error: error.message });
    }
};
// Bulk add students
export const bulkAddStudents = async (req, res) => {
    try {
        const { students } = req.body;
        if (!students || !Array.isArray(students)) {
            return res.status(400).json({ message: 'Please provide an array of students' });
        }

        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        for (const s of students) {
            try {
                const { name, email, rollNumber, password, departmentId, year, section, currentSemester } = s;

                // Basic validation
                if (!name || !email || !rollNumber || !password || !departmentId || !year || !section) {
                    results.failed++;
                    results.errors.push(`Missing fields for ${rollNumber || 'unknown'}`);
                    continue;
                }

                // Check duplicates (approximate, for real usage more robust checks needed)
                const existing = await Student.findOne({ rollNumber });
                if (existing) {
                    results.failed++;
                    results.errors.push(`Roll number ${rollNumber} already exists`);
                    continue;
                }

                // Create robust random hex IDs
                const studentId = `student-${crypto.randomBytes(16).toString('hex')}`;
                const userId = `user-${crypto.randomBytes(16).toString('hex')}`;

                await Student.create({
                    studentId, name, rollNumber, email, departmentId,
                    year: parseInt(year), section, currentSemester: currentSemester || 1
                });

                await User.create({
                    userId, name, email, password, role: 'student',
                    rollNumber, studentId, departmentId,
                    year: parseInt(year), section, currentSemester: currentSemester || 1
                });

                results.success++;
            } catch (err) {
                results.failed++;
                results.errors.push(`Error for ${s.rollNumber}: ${err.message}`);
            }
        }

        res.json({
            success: true,
            message: `Processed ${students.length} students.`,
            results
        });
    } catch (error) {
        console.error('Bulk add error:', error);
        res.status(500).json({ message: 'Error processing bulk import', error: error.message });
    }
};

// Get student details including user data and marks (for teachers/export)
export const getStudentDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const student = await Student.findOne({ studentId: id });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const user = await User.findOne({ studentId: id });
        const Marks = (await import('../models/Marks.js')).default;
        const marks = await Marks.find({ studentId: id });

        res.json({
            success: true,
            student,
            user: {
                email: student.email || user?.email
            },
            marks
        });
    } catch (error) {
        console.error('Get student details error:', error);
        res.status(500).json({ message: 'Error fetching student details', error: error.message });
    }
};
