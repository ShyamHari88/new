import express from 'express';
import {
    getAllSubjects,
    addSubject,
    updateSubject,
    deleteSubject,
    getTeacherSubjects
} from '../controllers/subjectController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all subjects (with optional filters)
router.get('/', getAllSubjects);

// Get subjects by teacher
router.get('/teacher/:teacherId', getTeacherSubjects);

// Add new subject (Admin only)
router.post('/', authorize('admin'), addSubject);

// Update subject (Admin only)
router.put('/:id', authorize('admin'), updateSubject);

// Delete subject (Admin only)
router.delete('/:id', authorize('admin'), deleteSubject);

export default router;
