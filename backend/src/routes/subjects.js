import express from 'express';
import {
    getAllSubjects,
    addSubject,
    updateSubject,
    deleteSubject,
    getTeacherSubjects
} from '../controllers/subjectController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all subjects (with optional filters)
router.get('/', getAllSubjects);

// Get subjects by teacher
router.get('/teacher/:teacherId', getTeacherSubjects);

// Add new subject
router.post('/', addSubject);

// Update subject
router.put('/:id', updateSubject);

// Delete subject
router.delete('/:id', deleteSubject);

export default router;
