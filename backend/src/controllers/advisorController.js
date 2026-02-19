import User from '../models/User.js';
import Student from '../models/Student.js';
import AttendanceRecord from '../models/AttendanceRecord.js';
import Marks from '../models/Marks.js';
import LeaveRequest from '../models/LeaveRequest.js';
import crypto from 'crypto';

// ... (keep createAdvisor as is - I will overwrite the file content to be safe and clean or just append) ...
// Actually, I'll rewrite the whole file with the new functions to ensure everything is there and valid.

// Create Advisor (Admin only)
export const createAdvisor = async (req, res) => {
    try {
        console.log('Creating advisor with body:', req.body);
        const { name, email, advisorId, password, departmentId, section } = req.body;

        if (!name || !advisorId || !password || !departmentId || !section) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const existingUser = await User.findOne({ $or: [{ advisorId }, { email }] });
        if (existingUser) {
            return res.status(400).json({
                message: existingUser.advisorId === advisorId ? 'Advisor ID already exists' : 'Email already exists'
            });
        }

        const userId = `user-${crypto.randomBytes(16).toString('hex')}`;

        const user = await User.create({
            userId,
            name,
            email: email || `${advisorId}@advisor.com`,
            password,
            role: 'advisor',
            advisorId,
            departmentId,
            section
        });

        res.status(201).json({
            success: true,
            message: 'Advisor created successfully',
            user: {
                name: user.name,
                advisorId: user.advisorId,
                departmentId: user.departmentId,
                section: user.section
            }
        });

    } catch (error) {
        console.error('Create advisor error:', error);
        res.status(500).json({ message: 'Error creating advisor', error: error.message });
    }
};

// Check Advisor Access Helper
const checkAdvisorAccess = async (reqUserId) => {
    const advisor = await User.findOne({ userId: reqUserId, role: 'advisor' });
    if (!advisor) {
        throw new Error('Access denied: Advisor not found');
    }
    return advisor;
};

// Get Pending Students
export const getPendingStudents = async (req, res) => {
    try {
        const advisor = await checkAdvisorAccess(req.user.userId);

        const pendingStudents = await User.find({
            role: 'student',
            departmentId: advisor.departmentId,
            section: advisor.section,
            isApproved: false
        }).select('name email rollNumber year currentSemester createdAt userId');

        res.json({
            success: true,
            count: pendingStudents.length,
            students: pendingStudents
        });

    } catch (error) {
        console.error('Get pending students error:', error);
        res.status(error.message.includes('Access denied') ? 403 : 500).json({ message: error.message });
    }
};

// Approve Student
export const approveStudent = async (req, res) => {
    try {
        const { studentUserId } = req.params;
        const advisor = await checkAdvisorAccess(req.user.userId);

        const student = await User.findOne({ userId: studentUserId, role: 'student' });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        if (student.departmentId !== advisor.departmentId || student.section !== advisor.section) {
            return res.status(403).json({ message: 'Student not in your section' });
        }

        student.isApproved = true;
        await student.save();

        const studentRecord = await Student.findOne({ studentId: student.studentId });
        if (studentRecord) {
            studentRecord.isApproved = true;
            await studentRecord.save();
        }

        res.json({
            success: true,
            message: `Student ${student.name} approved successfully`
        });

    } catch (error) {
        console.error('Approve student error:', error);
        res.status(500).json({ message: 'Error approving student', error: error.message });
    }
};

// Get All Advisors
export const getAllAdvisors = async (req, res) => {
    try {
        const advisors = await User.find({ role: 'advisor' }).select('-password');
        res.json(advisors);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching advisors' });
    }
};

// --- NEW FEATURES ---

// Get My Students (List with basic info + CGPA)
export const getMyStudents = async (req, res) => {
    try {
        const advisor = await checkAdvisorAccess(req.user.userId);

        // Fetch from Student model for academic details
        const students = await Student.find({
            departmentId: advisor.departmentId,
            section: advisor.section,
            isApproved: true
        }).select('name rollNumber email studentId year currentSemester cgpa');

        res.json({
            success: true,
            students
        });
    } catch (error) {
        console.error('Get my students error:', error);
        res.status(500).json({ message: 'Error fetching students' });
    }
};

// Get Student Details (Deep Dive)
export const getStudentDetails = async (req, res) => {
    try {
        const { studentId } = req.params; // Expecting ID from Student model (e.g., student-...)
        const advisor = await checkAdvisorAccess(req.user.userId);

        const student = await Student.findOne({ studentId });
        if (!student) return res.status(404).json({ message: 'Student not found' });

        if (student.departmentId !== advisor.departmentId || student.section !== advisor.section) {
            return res.status(403).json({ message: 'Student not in your section' });
        }

        // 1. Attendance Stats
        const attendanceRecords = await AttendanceRecord.find({ studentId });
        const totalSessions = attendanceRecords.length;
        const presentCount = attendanceRecords.filter(r => r.status === 'present' || r.status === 'od').length;
        const attendancePercentage = totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0;

        // 2. Marks Summary (Get latest assessment info)
        const recentMarks = await Marks.find({ studentId })
            .sort({ createdAt: -1 })
            .limit(10);

        // 3. Leave Requests
        const leaveRequests = await LeaveRequest.find({ studentId }).sort({ createdAt: -1 });

        res.json({
            success: true,
            student,
            attendance: {
                percentage: attendancePercentage.toFixed(1),
                totalSessions,
                presentCount
            },
            recentMarks,
            leaveRequests
        });

    } catch (error) {
        console.error('Get student details error:', error);
        res.status(500).json({ message: 'Error fetching student details' });
    }
};

// Update Student Grades (SGPA/CGPA)
export const updateStudentGrades = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { semester, sgpa, cgpa } = req.body;
        const advisor = await checkAdvisorAccess(req.user.userId);

        const student = await Student.findOne({ studentId });
        if (!student) return res.status(404).json({ message: 'Student not found' });

        if (student.departmentId !== advisor.departmentId || student.section !== advisor.section) {
            return res.status(403).json({ message: 'Student not in your section' });
        }

        // Update Semester Results (Bulk)
        if (req.body.semesterResults && Array.isArray(req.body.semesterResults)) {
            // Filter out empty or invalid entries
            const validResults = req.body.semesterResults
                .filter(r => r.semester && r.sgpa !== undefined && r.sgpa !== '')
                .map(r => ({
                    semester: parseInt(r.semester),
                    sgpa: parseFloat(r.sgpa)
                }));

            student.semesterResults = validResults;
        } else if (semester && sgpa !== undefined) {
            // Fallback for single semester update (legacy/compatibility)
            student.semesterResults = student.semesterResults.filter(r => r.semester !== parseInt(semester));
            student.semesterResults.push({ semester: parseInt(semester), sgpa: parseFloat(sgpa) });
        }

        // Update CGPA directly if provided
        if (cgpa !== undefined && cgpa !== '') {
            student.cgpa = parseFloat(cgpa);
        }

        await student.save();

        res.json({
            success: true,
            message: 'Grades updated successfully',
            student
        });

    } catch (error) {
        console.error('Update grades error:', error);
        res.status(500).json({ message: 'Error updating grades' });
    }
};

// Get Advisor Leave Requests
export const getActionableLeaveRequests = async (req, res) => {
    try {
        const advisor = await checkAdvisorAccess(req.user.userId);

        // 1. Get all student IDs in this section
        const students = await Student.find({
            departmentId: advisor.departmentId,
            section: advisor.section
        }).select('studentId');

        const studentIds = students.map(s => s.studentId);

        // 2. Find pending requests for these students using raw collection
        const requests = await LeaveRequest.collection.find({
            studentId: { $in: studentIds },
            status: 'pending'
        }).sort({ createdAt: 1 }).toArray();

        // Format for frontend: handle IDs and ensure attachments array exists
        const formattedRequests = requests.map(req => {
            // Handle legacy 'attachment' string/object if it exists
            let attachments = req.attachments || [];
            if (attachments.length === 0 && req.attachment) {
                attachments = [typeof req.attachment === 'string' ? { url: req.attachment, name: 'Attachment', type: 'image/jpeg' } : req.attachment];
            }

            return {
                ...req,
                _id: req._id.toString(),
                attachments: attachments.map(a => ({
                    ...a,
                    // Ensure URL is absolute
                    url: a.url?.startsWith('http') ? a.url : `${process.env.BACKEND_URL || 'http://localhost:5000'}${a.url?.startsWith('/') ? '' : '/'}${a.url || ''}`
                }))
            };
        });

        res.json({
            success: true,
            requests: formattedRequests
        });

    } catch (error) {
        console.error('Get leave requests error:', error);
        res.status(500).json({ message: 'Error fetching leave requests' });
    }
};

// Handle Leave Request (Approve/Reject)
export const handleLeaveRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status } = req.body; // 'approved' or 'rejected'
        const advisor = await checkAdvisorAccess(req.user.userId);

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const request = await LeaveRequest.findOne({ requestId });
        if (!request) return res.status(404).json({ message: 'Request not found' });

        // Verify student belongs to advisor
        const student = await Student.findOne({ studentId: request.studentId });
        if (!student || student.departmentId !== advisor.departmentId || student.section !== advisor.section) {
            return res.status(403).json({ message: 'Access denied: Student not in your section' });
        }

        request.status = status;
        await request.save();

        // --- NEW: Sync with LeaveController logic ---

        // 1. If approved and type is On-Duty, automatically mark attendance as OD
        if (status === 'approved' && request.type === 'On-Duty') {
            try {
                const startDate = new Date(request.fromDate);
                const endDate = new Date(request.toDate);

                const updateResult = await AttendanceRecord.updateMany(
                    {
                        studentId: request.studentId,
                        date: { $gte: startDate, $lte: endDate }
                    },
                    { $set: { status: 'od' } }
                );
                console.log(`✅ Advisor auto-marked ${updateResult.modifiedCount} records as OD for ${request.studentName}`);
            } catch (attendanceError) {
                console.error('Error auto-marking attendance as OD:', attendanceError);
            }
        }

        // 2. Send notification to student
        try {
            const Notification = (await import('../models/Notification.js')).default;
            await Notification.create({
                userId: request.studentId,
                title: `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                message: `Your ${request.type} request from ${new Date(request.fromDate).toLocaleDateString()} to ${new Date(request.toDate).toLocaleDateString()} has been ${status} by your Class Advisor.`,
                type: 'leave_update'
            });
        } catch (noteError) {
            console.error('Error sending student notification:', noteError);
        }

        res.json({
            success: true,
            message: status === 'approved' && request.type === 'On-Duty'
                ? 'OD approved and attendance automatically marked'
                : `Leave request ${status}`,
            leave: request
        });

    } catch (error) {
        console.error('Handle leave error:', error);
        res.status(500).json({ message: 'Error updating leave request' });
    }
};

// Get Today's Attendance Period-wise
export const getTodaysAttendance = async (req, res) => {
    try {
        const advisor = await checkAdvisorAccess(req.user.userId);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Find attendance records for today in advisor's section
        const records = await AttendanceRecord.find({
            departmentId: advisor.departmentId,
            section: advisor.section,
            date: { $gte: today, $lt: tomorrow }
        }).sort({ period: 1 });

        // Group by Period
        const periodStats = {};

        // Initialize common periods (e.g. 1-8) just in case, or dynamic
        records.forEach(record => {
            if (!periodStats[record.period]) {
                periodStats[record.period] = {
                    period: record.period,
                    subjectName: record.subjectName,
                    totalPresent: 0,
                    totalAbsent: 0,
                    totalOD: 0,
                    absentees: []
                };
            }

            if (record.status === 'present') periodStats[record.period].totalPresent++;
            else if (record.status === 'absent') {
                periodStats[record.period].totalAbsent++;
                // We could enable fetching student names here if needed, but for now just count or ID
                periodStats[record.period].absentees.push(record.rollNumber);
            }
            else if (record.status === 'od') periodStats[record.period].totalOD++;
        });

        const statsArray = Object.values(periodStats).sort((a, b) => a.period - b.period);

        res.json({
            success: true,
            date: today,
            stats: statsArray
        });

    } catch (error) {
        console.error('Get attendance stats error:', error);
        res.status(500).json({ message: 'Error fetching attendance stats' });
    }
};
