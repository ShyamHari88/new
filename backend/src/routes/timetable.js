
import express from 'express';
import {
    getClassTimetable,
    updateClassTimetable,
    getTeacherTimetable
} from '../controllers/timetableController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// Get class timetable (Students view their own, Teachers view any, Admin view any)
router.get('/class', getClassTimetable);

// Update class timetable (Admin or Teacher)
router.post('/class', authorize('admin', 'teacher'), updateClassTimetable);

// Get teacher timetable
router.get('/teacher/:teacherId', authorize('teacher', 'admin'), getTeacherTimetable);

export default router;
