import AttendanceRecord from '../models/AttendanceRecord.js';
import Student from '../models/Student.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import * as emailService from '../services/emailService.js';
import crypto from 'crypto';

// Get attendance records for a student
export const getStudentAttendance = async (req, res) => {
    try {
        const { studentId } = req.params;

        const records = await AttendanceRecord.find({ studentId }).sort({ date: -1 });

        // Calculate subject-wise stats
        const subjectStats = {};
        records.forEach(record => {
            if (!subjectStats[record.subjectName]) {
                subjectStats[record.subjectName] = {
                    subject: record.subjectName,
                    total: 0,
                    present: 0,
                    absent: 0,
                    od: 0,
                    percentage: 0,
                    semester: record.semester
                };
            }

            subjectStats[record.subjectName].total++;
            if (record.status === 'present') subjectStats[record.subjectName].present++;
            if (record.status === 'absent') subjectStats[record.subjectName].absent++;
            if (record.status === 'od') subjectStats[record.subjectName].od++;
        });

        // Calculate percentages
        Object.values(subjectStats).forEach(stat => {
            stat.percentage = stat.total > 0 ? Math.round((stat.present / stat.total) * 100) : 0;
        });

        res.json({
            success: true,
            records,
            subjectStats: Object.values(subjectStats)
        });
    } catch (error) {
        console.error('Get attendance error:', error);
        res.status(500).json({ message: 'Error fetching attendance', error: error.message });
    }
};

// Add attendance records (bulk)
export const addAttendanceRecords = async (req, res) => {
    try {
        const { records, topicCovered } = req.body;

        if (!records || !Array.isArray(records)) {
            return res.status(400).json({ message: 'Invalid records format' });
        }

        const teacherId = req.user.role === 'teacher' ? req.user.userId : req.body.teacherId;

        // Authorization check for teachers
        if (req.user.role === 'teacher' && records.length > 0) {
            const subjectModel = (await import('../models/Subject.js')).default;
            const subjectNames = [...new Set(records.map(r => r.subjectName))];

            for (const subjectName of subjectNames) {
                const isAllotted = await subjectModel.findOne({
                    teacherId: req.user.userId,
                    name: { $regex: new RegExp(`^${subjectName}$`, 'i') }
                });
                if (!isAllotted) {
                    return res.status(403).json({
                        message: `You are not authorized to add attendance for subject: ${subjectName}`
                    });
                }
            }
        }

        // Add topicCovered and teacherId to each record
        const recordsToSave = records.map(r => ({ ...r, topicCovered, teacherId }));

        const createdRecords = await AttendanceRecord.insertMany(recordsToSave);

        // Notify students and parents
        try {
            // Get all student IDs to find their User records for notifications
            const studentIds = records.map(r => r.studentId);
            const users = await User.find({ studentId: { $in: studentIds } });
            const userMap = new Map(users.map(u => [u.studentId, u.userId]));

            const notifications = [];

            for (const record of records) {
                const userId = userMap.get(record.studentId);
                if (userId) {
                    notifications.push({
                        userId,
                        title: `Attendance Marked: ${record.subjectName}`,
                        message: `You have been marked ${record.status.toUpperCase()} for ${record.subjectName} (Period ${record.period}) on ${new Date(record.date).toLocaleDateString()}.`,
                        type: 'attendance_alert',
                        senderId: req.user.userId
                    });
                }

                // Email notification for absent students (parents)
                if (record.status === 'absent') {
                    const student = await Student.findOne({ studentId: record.studentId });
                    if (student && student.email) {
                        emailService.sendAbsenceNotification(
                            student.email,
                            student.name,
                            record.subjectName,
                            record.date.toString().split('T')[0],
                            record.period
                        ).catch(err => console.error('Failed to send absence email:', err));
                    }
                }
            }

            if (notifications.length > 0) {
                await Notification.insertMany(notifications);
            }
        } catch (notificationError) {
            console.error('Failed to create notifications:', notificationError);
            // Don't fail the request if notifications fail
        }

        res.status(201).json({
            success: true,
            message: 'Attendance records added successfully',
            count: createdRecords.length
        });
    } catch (error) {
        console.error('Add attendance error:', error);
        res.status(500).json({ message: 'Error adding attendance', error: error.message });
    }
};

// Get all attendance records (for teachers)
export const getAllAttendance = async (req, res) => {
    try {
        const { departmentId, year, section, subjectName } = req.query;

        const filter = {};
        if (departmentId) filter.departmentId = departmentId;
        if (year) filter.year = parseInt(year);
        if (section) filter.section = section;
        if (subjectName) filter.subjectName = subjectName;

        // If teacher, show records for ALL subjects in departments where they handle at least one subject
        if (req.user.role === 'teacher') {
            const subjectModel = (await import('../models/Subject.js')).default;
            const teacherSubjects = await subjectModel.find({ teacherId: req.user.userId });
            const handledDepartmentIds = [...new Set(teacherSubjects.map(s => s.departmentId))];

            // Filter to show all records in handled departments
            filter.departmentId = { $in: handledDepartmentIds };
        }

        const records = await AttendanceRecord.find(filter).sort({ date: -1 });

        res.json({ success: true, records });
    } catch (error) {
        console.error('Get all attendance error:', error);
        res.status(500).json({ message: 'Error fetching attendance', error: error.message });
    }
};

// Get all attendance sessions (grouped by date, subject, period, class)
export const getAllSessions = async (req, res) => {
    try {
        const filter = {};
        let teacherAllottedSubjectNames = [];

        // If teacher, only show sessions for departments where they handle subjects
        if (req.user.role === 'teacher') {
            const subjectModel = (await import('../models/Subject.js')).default;
            const teacherSubjects = await subjectModel.find({ teacherId: req.user.userId });
            const handledDepartmentIds = [...new Set(teacherSubjects.map(s => s.departmentId))];
            teacherAllottedSubjectNames = teacherSubjects.map(s => s.name.toLowerCase());

            filter.departmentId = { $in: handledDepartmentIds };
        }

        const records = await AttendanceRecord.find(filter).sort({ date: -1 });

        // Group records into sessions
        const sessionsMap = new Map();

        records.forEach(record => {
            // Create a unique key for each session
            const sessionKey = `${record.date.toISOString().split('T')[0]}_${record.subjectName}_${record.period}_${record.departmentId}_${record.year}_${record.section}`;

            if (!sessionsMap.has(sessionKey)) {
                // Create deterministic session ID based on session attributes
                // This ensures the same session always has the same ID
                const sessionId = `session-${sessionKey.replace(/[^a-zA-Z0-9]/g, '-')}`;

                sessionsMap.set(sessionKey, {
                    id: sessionId,
                    date: record.date.toISOString().split('T')[0],
                    subject: record.subjectName,
                    period: record.period,
                    classInfo: {
                        departmentId: record.departmentId,
                        year: record.year,
                        section: record.section
                    },
                    topicCovered: record.topicCovered,
                    records: []
                });
            }

            sessionsMap.get(sessionKey).records.push(record);
        });

        // Convert to array and calculate stats
        const sessions = Array.from(sessionsMap.values()).map(session => {
            const totalStudents = session.records.length;
            const presentCount = session.records.filter(r => r.status === 'present').length;
            const absentCount = session.records.filter(r => r.status === 'absent').length;
            const odCount = session.records.filter(r => r.status === 'od').length;

            return {
                id: session.id,
                date: session.date,
                subject: session.subject,
                period: session.period,
                classInfo: session.classInfo,
                totalStudents,
                presentCount,
                absentCount,
                odCount,
                topicCovered: session.topicCovered,
                canEdit: req.user.role === 'admin' || teacherAllottedSubjectNames.includes(session.subject.toLowerCase())
            };
        });

        res.json({ success: true, sessions });
    } catch (error) {
        console.error('Get all sessions error:', error);
        res.status(500).json({ message: 'Error fetching sessions', error: error.message });
    }
};

// Get attendance records for a specific session
export const getAttendanceBySessionId = async (req, res) => {
    try {
        const { sessionId } = req.params;

        // Parse the session ID to extract session details
        // Format: session-YYYY-MM-DD-subjectName-period-deptId-year-section
        const parts = sessionId.replace('session-', '').split('-');

        if (parts.length < 8) {
            return res.status(400).json({ message: 'Invalid session ID format' });
        }

        // Extract date (YYYY-MM-DD)
        const dateStr = `${parts[0]}-${parts[1]}-${parts[2]}`;
        const date = new Date(dateStr);

        // Find where period starts (it's a number)
        let periodIndex = 3;
        let subjectParts = [];

        for (let i = 3; i < parts.length; i++) {
            if (!isNaN(parts[i]) && parts[i].length <= 2) {
                periodIndex = i;
                break;
            }
            subjectParts.push(parts[i]);
        }

        const subjectName = subjectParts.join(' ');
        const period = parseInt(parts[periodIndex]);
        const departmentId = parts[periodIndex + 1];
        const year = parseInt(parts[periodIndex + 2]);
        const section = parts[periodIndex + 3];

        // Authorization check for teachers
        if (req.user.role === 'teacher') {
            const subjectModel = (await import('../models/Subject.js')).default;
            // A teacher can VIEW if they handle subjects in the same department
            const teacherSubjects = await subjectModel.find({ teacherId: req.user.userId });
            const handledDepartmentIds = [...new Set(teacherSubjects.map(s => s.departmentId))];

            if (!handledDepartmentIds.includes(departmentId)) {
                return res.status(403).json({ message: 'You are not authorized to view this session' });
            }
        }

        // Find all records matching this session
        const records = await AttendanceRecord.find({
            date: {
                $gte: new Date(date.setHours(0, 0, 0, 0)),
                $lt: new Date(date.setHours(23, 59, 59, 999))
            },
            subjectName: { $regex: new RegExp(subjectName, 'i') },
            period,
            departmentId,
            year,
            section
        }).sort({ rollNumber: 1 });

        res.json({ success: true, records, topicCovered: records[0]?.topicCovered || '' });
    } catch (error) {
        console.error('Get attendance by session error:', error);
        res.status(500).json({ message: 'Error fetching session attendance', error: error.message });
    }
};

// Delete attendance records for a specific session
export const deleteAttendanceSession = async (req, res) => {
    try {
        const { date, subject, period, departmentId, year, section } = req.body;

        if (!date || !subject || period === undefined || !departmentId || !year || !section) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Authorization check for teachers
        if (req.user.role === 'teacher') {
            const subjectModel = (await import('../models/Subject.js')).default;
            const isAllotted = await subjectModel.findOne({
                teacherId: req.user.userId,
                name: { $regex: new RegExp(`^${subject}$`, 'i') }
            });

            if (!isAllotted) {
                return res.status(403).json({ message: 'You are not authorized to delete this session' });
            }
        }

        // Parse the date to match MongoDB format
        const sessionDate = new Date(date);
        const startOfDay = new Date(sessionDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(sessionDate.setHours(23, 59, 59, 999));

        // Delete all records matching this session
        const result = await AttendanceRecord.deleteMany({
            date: {
                $gte: startOfDay,
                $lt: endOfDay
            },
            subjectName: subject,
            period: parseInt(period),
            departmentId,
            year: parseInt(year),
            section
        });

        res.json({
            success: true,
            message: 'Session attendance deleted successfully',
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Delete attendance session error:', error);
        res.status(500).json({ message: 'Error deleting session attendance', error: error.message });
    }
};

// Get attendance stats for all students (bulk operation)
export const getAllStudentStats = async (req, res) => {
    try {
        const { departmentId, year, section } = req.query;

        // Build filter
        const filter = {};
        if (departmentId) filter.departmentId = departmentId;
        if (year) filter.year = parseInt(year);
        if (section) filter.section = section;

        // Get all attendance records matching the filter
        const records = await AttendanceRecord.find(filter);

        // Group by student and calculate stats
        const statsMap = new Map();

        records.forEach(record => {
            if (!statsMap.has(record.studentId)) {
                statsMap.set(record.studentId, {
                    studentId: record.studentId,
                    totalClasses: 0,
                    present: 0,
                    absent: 0,
                    od: 0
                });
            }

            const stats = statsMap.get(record.studentId);
            stats.totalClasses++;
            if (record.status === 'present') stats.present++;
            if (record.status === 'absent') stats.absent++;
            if (record.status === 'od') stats.od++;
        });

        // Calculate percentages and convert to array
        const studentStats = Array.from(statsMap.values()).map(stats => ({
            ...stats,
            percentage: stats.totalClasses > 0
                ? Math.round((stats.present / stats.totalClasses) * 100)
                : 0
        }));

        res.json({ success: true, stats: studentStats });
    } catch (error) {
        console.error('Get all student stats error:', error);
        res.status(500).json({ message: 'Error fetching student stats', error: error.message });
    }
};

// Get detailed attendance history for a student (with individual records)
export const getStudentAttendanceHistory = async (req, res) => {
    try {
        const { studentId } = req.params;

        // Get all attendance records for this student, sorted by date (newest first)
        const records = await AttendanceRecord.find({ studentId })
            .sort({ date: -1, period: 1 })
            .lean();

        // Format the records for the frontend
        const formattedRecords = records.map(record => ({
            _id: record._id,
            date: record.date,
            subject: record.subjectName,
            status: record.status,
            period: record.period,
            sessionId: `session-${record.date.toISOString().split('T')[0]}-${record.subjectName}-${record.period}-${record.departmentId}-${record.year}-${record.section}`.replace(/[^a-zA-Z0-9]/g, '-')
        }));

        res.json({
            success: true,
            records: formattedRecords
        });
    } catch (error) {
        console.error('Get student attendance history error:', error);
        res.status(500).json({ message: 'Error fetching attendance history', error: error.message });
    }
};
