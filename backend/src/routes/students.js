import express from 'express';
import {
    getAllStudents,
    addStudent,
    updateStudent,
    deleteStudent,
    getStudentDetails,
    bulkAddStudents
} from '../controllers/studentController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all students (Teachers/Admins)
router.get('/', authorize('teacher', 'admin'), getAllStudents);

// Add new student (Teachers/Admins)
router.post('/', authorize('teacher', 'admin'), addStudent);

// Bulk add students (Teachers/Admins)
router.post('/bulk', authorize('teacher', 'admin'), bulkAddStudents);

// Update student (Teachers/Admins)
router.put('/:id', authorize('teacher', 'admin'), updateStudent);

// Delete student (Only Admins)
router.delete('/:id', authorize('admin'), deleteStudent);

// Get detailed info (including marks and user data) - Teachers/Admins
router.get('/:id/details', authorize('teacher', 'admin'), getStudentDetails);

export default router;
