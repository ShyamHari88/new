
import api from './api';
import { Student } from '@/types/attendance';

export type Role = 'teacher' | 'student' | 'admin' | 'advisor';

export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    studentId?: string;
    rollNumber?: string;
    teacherId?: string;
    advisorId?: string;
    departmentId?: string;
    year?: number;
    section?: string;
    currentSemester?: number;
    isFirstLogin?: boolean;
}

const STORAGE_KEY = 'attendease_user';

export const authService = {
    // Student Signup
    studentSignup: async (data: {
        name: string;
        email: string;
        rollNumber: string;
        password: string;
        departmentId: string;
        year: number;
        section: string;
        currentSemester?: number;
    }): Promise<User> => {
        try {
            const response = await api.post('/auth/student/signup', data);
            const { token, user } = response.data;

            // Store token and user
            localStorage.setItem('token', token);
            const userData: User = {
                id: user.userId,
                name: user.name,
                email: user.email,
                role: user.role,
                studentId: user.studentId,
                rollNumber: user.rollNumber,
                departmentId: user.departmentId,
                year: user.year,
                section: user.section,
                currentSemester: user.currentSemester
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));

            return userData;
        } catch (error: any) {
            const serverMessage = error.response?.data?.message;
            const detailedError = error.response?.data?.detailedError;

            const message = detailedError
                ? `${serverMessage}: ${detailedError}`
                : (serverMessage || error.message || 'Signup failed');

            console.error('Student Signup Error:', message, error);
            throw new Error(message);
        }
    },

    // Student Login
    studentLogin: async (rollNumber: string, password: string): Promise<User> => {
        try {
            const response = await api.post('/auth/student/login', { rollNumber, password });
            const { token, user } = response.data;

            // Store token and user
            localStorage.setItem('token', token);
            const userData: User = {
                id: user.userId,
                name: user.name,
                email: user.email,
                role: user.role,
                studentId: user.studentId,
                rollNumber: user.rollNumber,
                departmentId: user.departmentId,
                year: user.year,
                section: user.section,
                currentSemester: user.currentSemester,
                isFirstLogin: user.isFirstLogin
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));

            return userData;
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Login failed';
            console.error('Student Login Error:', message, error);
            throw new Error(message);
        }
    },

    // Teacher Signup
    teacherSignup: async (data: {
        name: string;
        email: string;
        teacherId: string;
        password: string;
        departmentId: string;
    }): Promise<User> => {
        try {
            const response = await api.post('/auth/teacher/signup', data);
            const { token, user } = response.data;

            // Store token and user
            localStorage.setItem('token', token);
            const userData: User = {
                id: user.userId,
                name: user.name,
                email: user.email,
                role: user.role,
                teacherId: user.teacherId
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));

            return userData;
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Signup failed';
            console.error('Teacher Signup Error:', message, error);
            throw new Error(message);
        }
    },

    // Teacher Login
    teacherLogin: async (teacherId: string, password: string): Promise<User> => {
        try {
            const response = await api.post('/auth/teacher/login', { teacherId, password });
            const { token, user } = response.data;

            // Store token and user
            localStorage.setItem('token', token);
            const userData: User = {
                id: user.userId,
                name: user.name,
                email: user.email,
                role: user.role,
                teacherId: user.teacherId,
                isFirstLogin: user.isFirstLogin
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));

            return userData;
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Login failed';
            console.error('Teacher Login Error:', message, error);
            throw new Error(message);
        }
    },

    // Admin Login
    adminLogin: async (email: string, password: string): Promise<User> => {
        try {
            const response = await api.post('/auth/admin/login', { email, password });
            const { token, user } = response.data;

            // Store token and user
            localStorage.setItem('token', token);
            const userData: User = {
                id: user.userId,
                name: user.name,
                email: user.email,
                role: user.role,
                isFirstLogin: user.isFirstLogin
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));

            return userData;
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Login failed';
            console.error('Admin Login Error:', message, error);
            throw new Error(message);
        }
    },

    // Advisor Login
    advisorLogin: async (advisorId: string, password: string): Promise<User> => {
        try {
            const response = await api.post('/auth/advisor/login', { advisorId, password });
            const { token, user } = response.data;

            // Store token and user
            localStorage.setItem('token', token);
            const userData: User = {
                id: user.userId,
                name: user.name,
                email: user.email,
                role: user.role,
                advisorId: user.advisorId,
                departmentId: user.departmentId,
                section: user.section,
                isFirstLogin: user.isFirstLogin
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));

            return userData;
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Login failed';
            console.error('Advisor Login Error:', message, error);
            throw new Error(message);
        }
    },

    // Forgot Password
    forgotPassword: async (email: string): Promise<void> => {
        try {
            await api.post('/auth/forgot-password', { email });
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Failed to send reset email';
            console.error('Forgot Password Error:', message, error);
            throw new Error(message);
        }
    },

    // Reset Password
    resetPassword: async (token: string, password: string): Promise<void> => {
        try {
            await api.post(`/auth/reset-password/${token}`, { password });
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Failed to reset password';
            console.error('Reset Password Error:', message, error);
            throw new Error(message);
        }
    },

    // Change Password
    changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
        try {
            await api.post('/auth/change-password', { currentPassword, newPassword });

            // Update local storage to mark isFirstLogin as false
            const userData = authService.getCurrentUser();
            if (userData) {
                userData.isFirstLogin = false;
                localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
            }
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || 'Failed to change password';
            console.error('Change Password Error:', message, error);
            throw new Error(message);
        }
    },

    // Logout
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem(STORAGE_KEY);
        window.location.href = '/login';
    },

    // Get Current User
    getCurrentUser: (): User | null => {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    },

    // Check if authenticated
    isAuthenticated: (): boolean => {
        return !!localStorage.getItem('token');
    }
};
