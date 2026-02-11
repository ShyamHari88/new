import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Student from '../models/Student.js';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../services/emailService.js';

// Generate JWT Token
const generateToken = (userId, role) => {
    return jwt.sign(
        { userId, role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// Student Signup
export const studentSignup = async (req, res) => {
    try {
        const { name, email, rollNumber, password, departmentId, year, section, currentSemester } = req.body;

        // Validation
        if (!name || !email || !rollNumber || !password || !departmentId || !year || !section) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { rollNumber }] });
        if (existingUser) {
            console.log(`[AUTH] User duplicate found: ${email} or ${rollNumber}`);
            return res.status(400).json({
                message: existingUser.email === email ? 'Email already registered' : 'Roll number already registered'
            });
        }

        // Check if student record exists (zombie check)
        const existingStudent = await Student.findOne({ rollNumber });
        if (existingStudent) {
            console.log(`[AUTH] Student duplicate found: ${rollNumber}`);
            return res.status(400).json({ message: 'Student record with this roll number already exists' });
        }

        // Create student ID using robust random hex
        const studentId = `student-${crypto.randomBytes(16).toString('hex')}`;
        const userId = `user-${crypto.randomBytes(16).toString('hex')}`;

        console.log(`[AUTH] Creating user for ${email}`);
        // Create user
        const user = await User.create({
            userId,
            name,
            email,
            password,
            role: 'student',
            rollNumber,
            studentId,
            departmentId,
            year: parseInt(year),
            section,
            currentSemester: currentSemester || 1
        });
        console.log(`[AUTH] User created: ${user._id}`);

        console.log(`[AUTH] Creating student record for ${rollNumber}`);
        // Create student record
        console.log("EMAIL CHECK 👉", email, req.body.email);

        await Student.create({
            studentId,
            name,
            email: req.body.email,

            rollNumber,
            departmentId,
            year: parseInt(year),
            section,
            currentSemester: currentSemester || 1
        });
        console.log(`[AUTH] Student record created`);

        // Generate token
        const token = generateToken(user.userId, user.role);

        // Send response FIRST
        res.status(201).json({
            success: true,
            message: 'Student account created successfully',
            token,
            user: {
                userId: user.userId,
                name: user.name,
                email: user.email,
                role: user.role,
                rollNumber: user.rollNumber,
                studentId: user.studentId,
                departmentId: user.departmentId,
                year: user.year,
                section: user.section,
                currentSemester: user.currentSemester
            }
        });

        // Send welcome email AFTER response (don't wait for it, don't let it affect the response)
        sendWelcomeEmail(email, name, 'student').catch(err => console.error('Welcome email failed (non-critical):', err));
    } catch (error) {
        console.error('Student signup error:', error);
        // Only send error response if we haven't sent a success response yet
        if (!res.headersSent) {
            res.status(500).json({
                message: 'Error creating student account',
                detailedError: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
};

// Student Login
export const studentLogin = async (req, res) => {
    try {
        const { rollNumber, password } = req.body;
        console.log(`[AUTH] Student login attempt: ${rollNumber}`);

        if (!rollNumber || !password) {
            return res.status(400).json({ message: 'Please provide roll number and password' });
        }

        // Find user by roll number
        const user = await User.findOne({ rollNumber, role: 'student' });
        if (!user) {
            console.log(`[AUTH] Student not found: ${rollNumber}`);
            return res.status(401).json({ message: 'Invalid roll number or password' });
        }

        // Check password
        console.log(`[AUTH] Checking password for student: ${rollNumber}`);
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log(`[AUTH] Password mismatch for student: ${rollNumber}`);
            return res.status(401).json({ message: 'Invalid roll number or password' });
        }

        // Check if account is active
        if (!user.isActive) {
            console.log(`[AUTH] Account inactive for student: ${rollNumber}`);
            return res.status(403).json({ message: 'Account is deactivated' });
        }

        // Generate token
        console.log(`[AUTH] Generating token for student: ${rollNumber}`);
        const token = generateToken(user.userId, user.role);

        console.log(`[AUTH] Login success for student: ${rollNumber}`);
        res.json({
            success: true,
            token,
            user: {
                userId: user.userId,
                name: user.name,
                email: user.email,
                role: user.role,
                rollNumber: user.rollNumber,
                studentId: user.studentId,
                departmentId: user.departmentId,
                year: user.year,
                section: user.section,
                currentSemester: user.currentSemester,
                isFirstLogin: user.isFirstLogin || false
            }
        });

        // Update last login
        user.lastLogin = new Date();
        await user.save();
    } catch (error) {
        console.error('[AUTH] Student login error:', error);
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
};

// Teacher Signup
export const teacherSignup = async (req, res) => {
    try {
        const { name, email, teacherId, password, departmentId } = req.body;

        // Validation
        if (!name || !email || !teacherId || !password || !departmentId) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { teacherId }] });
        if (existingUser) {
            return res.status(400).json({
                message: existingUser.email === email ? 'Email already registered' : 'Teacher ID already registered'
            });
        }

        // Create user ID using robust random hex
        const userId = `user-${crypto.randomBytes(16).toString('hex')}`;

        // Create user
        const user = await User.create({
            userId,
            name,
            email,
            password,
            role: 'teacher',
            teacherId,
            departmentId
        });

        // Generate token
        const token = generateToken(user.userId, user.role);

        // Send response FIRST
        res.status(201).json({
            success: true,
            message: 'Teacher account created successfully',
            token,
            user: {
                userId: user.userId,
                name: user.name,
                email: user.email,
                role: user.role,
                teacherId: user.teacherId
            }
        });

        // Send welcome email AFTER response (don't wait for it, don't let it affect the response)
        sendWelcomeEmail(email, name, 'teacher').catch(err => console.error('Welcome email failed (non-critical):', err));
    } catch (error) {
        console.error('Teacher signup error:', error);
        // Only send error response if we haven't sent a success response yet
        if (!res.headersSent) {
            res.status(500).json({ message: 'Error creating teacher account', error: error.message });
        }
    }
};

// Teacher Login
export const teacherLogin = async (req, res) => {
    try {
        const { teacherId, password } = req.body;

        if (!teacherId || !password) {
            return res.status(400).json({ message: 'Please provide teacher ID and password' });
        }

        // Find user by teacher ID
        const user = await User.findOne({ teacherId, role: 'teacher' });
        if (!user) {
            return res.status(401).json({ message: 'Invalid teacher ID or password' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid teacher ID or password' });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(403).json({ message: 'Account is deactivated' });
        }

        // Generate token
        const token = generateToken(user.userId, user.role);

        res.json({
            success: true,
            token,
            user: {
                userId: user.userId,
                name: user.name,
                email: user.email,
                role: user.role,
                teacherId: user.teacherId,
                isFirstLogin: user.isFirstLogin || false
            }
        });

        // Update last login
        user.lastLogin = new Date();
        await user.save();
    } catch (error) {
        console.error('Teacher login error:', error);
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
};

// Admin Login
export const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // Find user by email and admin role
        const user = await User.findOne({ email, role: 'admin' });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check password (direct comparison if not hashed, or use comparePassword if model supports it)
        // Since we manually created the admin and might update it later to be hashed, we should check how it was stored.
        // The User model likely has a pre-save hook for hashing.
        // In create-admin.js we just did `admin.password = adminPass; await admin.save();`
        // If the User model has a pre-save hook, it's hashed. Let's assume it works like others.

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate token
        const token = generateToken(user.userId, user.role);

        res.json({
            success: true,
            token,
            user: {
                userId: user.userId,
                name: user.name,
                email: user.email,
                role: user.role,
                isFirstLogin: user.isFirstLogin || false
            }
        });

        // Update last login
        user.lastLogin = new Date();
        await user.save();
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
};

// Change Password
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.userId;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Please provide current and new password' });
        }

        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if current password is correct
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect current password' });
        }

        // Set new password
        user.password = newPassword; // Will be hashed by pre-save hook
        user.isFirstLogin = false;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Error changing password', error: error.message });
    }
};

// Forgot Password
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Please provide email address' });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'No account found with this email' });
        }

        // Generate reset token
        const resetToken = user.getResetPasswordToken();
        await user.save();

        // Send email
        const emailResult = await sendPasswordResetEmail(email, resetToken, user.name);

        if (!emailResult.success) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
            return res.status(500).json({ message: 'Error sending email' });
        }

        res.json({
            success: true,
            message: 'Password reset email sent successfully'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Error processing request', error: error.message });
    }
};

// Reset Password
export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ message: 'Please provide new password' });
        }

        // Hash token
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find user with valid token
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Set new password
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Password reset successful'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Error resetting password', error: error.message });
    }
};

// Get Current User
export const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findOne({ userId: req.user.userId }).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
};
