import express from 'express';
import {
    getStudentAttendance,
    addAttendanceRecords,
    getAllAttendance,
    getAllSessions,
    getAttendanceBySessionId,
    deleteAttendanceSession,
    getAllStudentStats,
    getStudentAttendanceHistory
} from '../controllers/attendanceController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get student attendance (Student can see their own, Teacher/Admin can see any)
router.get('/student/:studentId', getStudentAttendance);

// Get detailed attendance history for a student
router.get('/student/:studentId/history', getStudentAttendanceHistory);

// Get all student stats (bulk) - Teachers and Admins only
router.get('/stats/bulk', authorize('teacher', 'admin'), getAllStudentStats);

// Add attendance records (Only Teachers and Admins)
router.post('/', authorize('teacher', 'admin'), addAttendanceRecords);

// Get all attendance sessions (Teachers and Admins)
router.get('/sessions', authorize('teacher', 'admin'), getAllSessions);

// Get attendance by session ID (Teachers and Admins)
router.get('/session/:sessionId', authorize('teacher', 'admin'), getAttendanceBySessionId);

// Delete attendance session (Teachers and Admins)
router.delete('/session', authorize('teacher', 'admin'), deleteAttendanceSession);

// Get all attendance (Teachers and Admins)
router.get('/', authorize('teacher', 'admin'), getAllAttendance);

export default router;
