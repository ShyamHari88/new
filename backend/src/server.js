import dotenv from "dotenv";

dotenv.config();



import fs from 'fs';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose'; // Add this import
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import attendanceRoutes from './routes/attendance.js';
import marksRoutes from './routes/marks.js';
import subjectRoutes from './routes/subjects.js';
import leaveRoutes from './routes/leaves.js';
import teacherRoutes from './routes/teachers.js';
import timetableRoutes from './routes/timetable.js';
import notificationRoutes from './routes/notifications.js';
import advisorRoutes from './routes/advisor.js';

const app = express();

// Middleware
app.use(cors({
    origin: '*',

    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware after body parsing
app.use((req, res, next) => {
    if (req.url.startsWith('/api/auth')) {
        const bodyKeys = (req.body && typeof req.body === 'object') ? Object.keys(req.body) : 'none';
        console.log(`[AUTH DEBUG] ${req.method} ${req.url} - Body Keys: ${bodyKeys}`);
    }
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/marks', marksRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/advisor', advisorRoutes);



// Serve uploads
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check route
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Class Connect Backend Server is running',
        version: '1.0.3', // Increment version
        timestamp: new Date().toISOString()
    });
});

// Database Debug Route
app.get('/debug-db', async (req, res) => {
    try {
        const state = mongoose.connection.readyState;
        const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];

        let collections = [];
        let error = null;

        if (state === 1) {
            try {
                collections = await mongoose.connection.db.listCollections().toArray();
                collections = collections.map(c => c.name);
            } catch (err) {
                error = err.message;
            }
        }

        res.json({
            status: state === 1 ? 'OK' : 'ERROR',
            connectionState: states[state] || 'unknown',
            readyState: state,
            collections,
            dbError: error,
            env: {
                hasMongoURI: !!process.env.MONGODB_URI,
                uriStart: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 15) + '...' : 'undefined'
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API Routes
app.get('/api', (req, res) => {
    res.json({
        message: 'Class Connect API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            api: '/api'
        }
    });
});

// JSON Error Handler middleware
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('Bad JSON:', err.message);
        return res.status(400).send({ status: 400, message: err.message }); // Bad request
    }
    next(err);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);

    // Log globally to file using synchronous fs
    try {
        fs.appendFileSync('server-error.log', `${new Date().toISOString()} - ${err.message}\n${err.stack}\n\n`);
    } catch (e) {
        console.error('Failed to write to log file', e);
    }

    res.status(500).json({
        message: 'Something went wrong!',
        error: err.message
    });
});

// Start server
// Start server
const PORT = process.env.PORT || 5000;

// Only listen if the file is being run directly (not imported)
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`📍 API endpoint: http://localhost:${PORT}/api\n`);
});


export default app;
