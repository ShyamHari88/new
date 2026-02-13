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

// Get all students (Teachers/Admins/Advisors)
router.get('/', authorize('teacher', 'admin', 'advisor'), getAllStudents);

// Add new student (Teachers/Admins/Advisors)
router.post('/', authorize('teacher', 'admin', 'advisor'), addStudent);

// Bulk add students (Teachers/Admins/Advisors)
router.post('/bulk', authorize('teacher', 'admin', 'advisor'), bulkAddStudents);

// Update student (Teachers/Admins/Advisors)
router.put('/:id', authorize('teacher', 'admin', 'advisor'), updateStudent);

// Delete student (Only Admins/Advisors)
router.delete('/:id', authorize('admin', 'advisor'), deleteStudent);

// Get detailed info (including marks and user data) - Teachers/Admins/Advisors
router.get('/:id/details', authorize('teacher', 'admin', 'advisor'), getStudentDetails);

export default router;
