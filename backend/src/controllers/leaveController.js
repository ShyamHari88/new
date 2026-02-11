import mongoose from 'mongoose';
import LeaveRequest from '../models/LeaveRequest.js';
import AttendanceRecord from '../models/AttendanceRecord.js';
import Student from '../models/Student.js';
import Notification from '../models/Notification.js';
import crypto from 'crypto';

export const applyLeave = async (req, res) => {
    try {
        const { studentId, studentName, rollNumber, type, fromDate, toDate, reason } = req.body;

        // Create robust random hex ID for request
        const requestId = `leave-${crypto.randomBytes(16).toString('hex')}`;

        const leave = await LeaveRequest.create({
            requestId, studentId, studentName, rollNumber, type, fromDate, toDate, reason
        });

        res.status(201).json({ success: true, message: 'Leave request submitted', leave });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting leave', error: error.message });
    }
};

export const getStudentLeaves = async (req, res) => {
    const { studentId } = req.params;
    // Use raw collection to ensure we get attachments regardless of schema state
    const leaves = await LeaveRequest.collection.find({ studentId }).sort({ appliedOn: -1 }).toArray();
    res.json({ success: true, leaves });
};

export const getAllLeaves = async (req, res) => {
    // Use raw collection to ensure we get attachments regardless of schema state
    const leaves = await LeaveRequest.collection.find().sort({ appliedOn: -1 }).toArray();
    res.json({ success: true, leaves });
};

export const updateLeaveStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        console.log(`[LEAVE UPDATE] Attempting to update leave: id=${id}, status=${status}`);

        // Try finding by requestId first
        let leave = await LeaveRequest.findOneAndUpdate(
            { requestId: id },
            { status },
            { new: true }
        );

        // If not found by requestId, try by MongoDB _id
        if (!leave) {
            console.log(`[LEAVE UPDATE] Not found by requestId, trying _id...`);
            try {
                leave = await LeaveRequest.findByIdAndUpdate(
                    id,
                    { status },
                    { new: true }
                );
            } catch (idErr) {
                console.log(`[LEAVE UPDATE] _id lookup also failed:`, idErr.message);
            }
        }

        // Last resort: try raw collection update
        if (!leave) {
            console.log(`[LEAVE UPDATE] Trying raw collection update...`);
            const rawResult = await LeaveRequest.collection.findOneAndUpdate(
                { requestId: id },
                { $set: { status } },
                { returnDocument: 'after' }
            );
            leave = rawResult?.value || rawResult;
        }

        if (!leave) {
            console.log(`[LEAVE UPDATE] Leave request NOT FOUND for id: ${id}`);
            return res.status(404).json({ message: 'Leave request not found' });
        }

        console.log(`[LEAVE UPDATE] ✅ Successfully updated leave ${id} to status: ${status}`);

        // If approved and type is On-Duty, automatically mark attendance as OD
        if (status === 'approved' && leave.type === 'On-Duty') {
            try {
                // Get student details
                const student = await Student.findOne({ studentId: leave.studentId });

                if (student) {
                    // Get all dates between fromDate and toDate
                    const startDate = new Date(leave.fromDate);
                    const endDate = new Date(leave.toDate);

                    // Update all existing attendance records for this student in the date range
                    const updateResult = await AttendanceRecord.updateMany(
                        {
                            studentId: leave.studentId,
                            date: {
                                $gte: startDate,
                                $lte: endDate
                            }
                        },
                        {
                            $set: { status: 'od' }
                        }
                    );

                    console.log(`✅ Auto-marked ${updateResult.modifiedCount} attendance records as OD for ${leave.studentName}`);
                }
            } catch (attendanceError) {
                console.error('Error auto-marking attendance as OD:', attendanceError);
                // Don't fail the leave approval if attendance update fails
            }
        }

        // Send notification to student
        try {
            await Notification.create({
                userId: leave.studentId,
                title: `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                message: `Your ${leave.type} request from ${new Date(leave.fromDate).toLocaleDateString()} to ${new Date(leave.toDate).toLocaleDateString()} has been ${status}.`,
                type: 'leave_update'
            });
        } catch (noteError) {
            console.error('Error sending leave notification:', noteError);
        }

        res.json({
            success: true,
            message: status === 'approved' && leave.type === 'On-Duty'
                ? 'OD approved and attendance automatically marked'
                : 'Leave status updated',
            leave
        });
    } catch (error) {
        console.error(`[LEAVE UPDATE] Error:`, error.message);
        res.status(500).json({ message: 'Error updating leave status', error: error.message });
    }
};

export const uploadAttachments = async (req, res) => {
    try {
        const { id } = req.params;
        const files = req.files;

        // DEBUG: Log to file
        import('fs').then(fs => {
            fs.appendFileSync('upload-debug.log', `\n--- NEW UPLOAD ATTEMPT --- RequestID: ${id}\n`);
        });

        if (!files || files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const attachments = files.map(file => ({
            name: file.originalname,
            size: file.size,
            type: file.mimetype,
            path: file.path,
            url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${file.filename}`
        }));

        // Use RAW DRIVER via mongoose connection to guarantee schema bypass
        // Dynamically get collection name from model
        const result = await mongoose.connection.collection(LeaveRequest.collection.collectionName).findOneAndUpdate(
            { requestId: id },
            { $push: { attachments: { $each: attachments } } },
            { returnDocument: 'after' }
        );

        import('fs').then(fs => {
            fs.appendFileSync('upload-debug.log', `Result: ${JSON.stringify(result, null, 2)}\n`);
        });

        const updatedDoc = result.value || result;

        if (!updatedDoc) {
            return res.status(404).json({ message: 'Leave request not found' });
        }

        res.json({ success: true, message: 'Files uploaded successfully', leave: updatedDoc });
    } catch (error) {
        console.error('Upload error:', error);
        import('fs').then(fs => {
            fs.appendFileSync('upload-error.log', `${new Date().toISOString()} - ${error.message}\n${error.stack}\n\n`);
        });
        res.status(500).json({ message: 'Error uploading files', error: error.message });
    }
};
