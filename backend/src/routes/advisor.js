import express from 'express';
import {
    createAdvisor,
    getPendingStudents,
    approveStudent,
    getAllAdvisors,
    getMyStudents,
    getStudentDetails,
    updateStudentGrades,
    getActionableLeaveRequests,
    handleLeaveRequest,
    getTodaysAttendance
} from '../controllers/advisorController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Admin routes
router.post('/create', authenticate, authorize('admin'), createAdvisor);
router.get('/all', authenticate, authorize('admin'), getAllAdvisors);

// Advisor routes
router.get('/pending-students', authenticate, authorize('advisor'), getPendingStudents);
router.put('/approve-student/:studentUserId', authenticate, authorize('advisor'), approveStudent);
router.get('/todays-attendance', authenticate, authorize('advisor'), getTodaysAttendance);

// Student Management (Advisor)
router.get('/my-students', authenticate, authorize('advisor'), getMyStudents);
router.get('/student/:studentId', authenticate, authorize('advisor'), getStudentDetails);
router.put('/student/:studentId/grades', authenticate, authorize('advisor'), updateStudentGrades);

// Leave Management (Advisor)
router.get('/leave-requests', authenticate, authorize('advisor'), getActionableLeaveRequests);
router.put('/leave-request/:requestId', authenticate, authorize('advisor'), handleLeaveRequest);

export default router;
