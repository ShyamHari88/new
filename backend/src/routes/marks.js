import express from 'express';
import {
    getStudentMarks,
    addMarks,
    getAllMarks,
    updateMark
} from '../controllers/marksController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get student marks
router.get('/student/:studentId', getStudentMarks);

// Add marks (Teacher/Admin only)
router.post('/', authorize('teacher', 'admin'), addMarks);

// Update a mark (Teacher/Admin only)
router.put('/:id', authorize('teacher', 'admin'), updateMark);

// Get all marks (for teachers)
router.get('/', authorize('teacher', 'admin'), getAllMarks);

export default router;
