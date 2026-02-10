
import Notification from '../models/Notification.js';

// Get notifications for current user
export const getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user.userId })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json({ success: true, notifications });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ message: 'Error fetching notifications', error: error.message });
    }
};

// Create a notification (Internal or Teacher-to-Student)
export const createNotification = async (req, res) => {
    try {
        const { userId, title, message, type, link } = req.body;

        if (!userId || !title || !message) {
            return res.status(400).json({ message: 'Please provide recipient, title and message' });
        }

        const notification = await Notification.create({
            userId,
            title,
            message,
            type: type || 'general',
            senderId: req.user.userId,
            link
        });

        res.status(201).json({ success: true, notification });
    } catch (error) {
        console.error('Create notification error:', error);
        res.status(500).json({ message: 'Error creating notification', error: error.message });
    }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findOneAndUpdate(
            { _id: id, userId: req.user.userId },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json({ success: true, notification });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ message: 'Error updating notification', error: error.message });
    }
};

// Mark all as read
export const markAllRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user.userId, isRead: false },
            { isRead: true }
        );
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all read error:', error);
        res.status(500).json({ message: 'Error updating notifications', error: error.message });
    }
};
