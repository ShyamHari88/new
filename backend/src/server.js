import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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

// Load environment variables
dotenv.config();

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
        timestamp: new Date().toISOString()
    });
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

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);

    // Log globally to file
    import('fs').then(fs => {
        fs.appendFileSync('server-error.log', `${new Date().toISOString()} - ${err.message}\n${err.stack}\n\n`);
    });

    res.status(500).json({
        message: 'Something went wrong!',
        error: err.message // Always show error message for now to help user debug
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`📍 API endpoint: http://localhost:${PORT}/api\n`);
});
