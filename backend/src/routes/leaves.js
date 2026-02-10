import express from 'express';
import { applyLeave, getStudentLeaves, getAllLeaves, updateLeaveStatus, uploadAttachments } from '../controllers/leaveController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();
router.use(authenticate);

// Apply for leave (Students)
router.post('/', authorize('student'), applyLeave);

// Get student's own leaves
router.get('/student/:studentId', getStudentLeaves);

// Get all leaves (Teachers/Admins)
router.get('/all', authorize('teacher', 'admin'), getAllLeaves);

// Update status (Teachers/Admins)
// Update status (Teachers/Admins)
router.put('/:id', authorize('teacher', 'admin'), updateLeaveStatus);

// Upload attachments (Students)
router.post('/:id/upload', authorize('student'), upload.array('files', 5), uploadAttachments);

export default router;
