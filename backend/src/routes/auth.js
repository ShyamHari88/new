import express from 'express';
import {
    studentSignup,
    studentLogin,
    teacherSignup,
    teacherLogin,
    adminLogin,
    forgotPassword,
    resetPassword,
    getCurrentUser,
    changePassword
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Student routes
router.post('/student/signup', studentSignup);
router.post('/student/login', studentLogin);

// Teacher routes
router.post('/teacher/signup', teacherSignup);
router.post('/teacher/login', teacherLogin);

// Admin routes
router.post('/admin/login', adminLogin);

// Password reset routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Get current user (protected route)
router.get('/me', authenticate, getCurrentUser);

// Change password (protected route)
router.post('/change-password', authenticate, changePassword);

export default router;
