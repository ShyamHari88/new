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

// Add marks (Teacher/Admin/Advisor only)
router.post('/', authorize('teacher', 'admin', 'advisor'), addMarks);

// Update a mark (Teacher/Admin/Advisor only)
router.put('/:id', authorize('teacher', 'admin', 'advisor'), updateMark);

// Get all marks (for teachers/admins/advisors)
router.get('/', authorize('teacher', 'admin', 'advisor'), getAllMarks);

export default router;
