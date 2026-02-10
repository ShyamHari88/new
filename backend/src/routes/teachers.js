
import express from 'express';
import { getAllTeachers, updateTeacher, deleteTeacher } from '../controllers/teacherController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all teachers (Admin/Teacher can view?) - Admin mainly
router.get('/', authorize('admin'), getAllTeachers);

// Update/Delete teacher (Admin only)
router.put('/:id', authorize('admin'), updateTeacher);
router.delete('/:id', authorize('admin'), deleteTeacher);

export default router;
