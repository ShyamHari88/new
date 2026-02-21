
import express from 'express';
import {
    getMyNotifications,
    createNotification,
    markAsRead,
    markAllRead,
    subscribePush,
    unsubscribePush
} from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';
import { sendPushNotification } from '../services/pushService.js';

const router = express.Router();


router.use(authenticate);

router.get('/', getMyNotifications);
router.post('/', createNotification);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllRead);

// Push Notification Subscriptions
router.post('/subscribe', subscribePush);
router.post('/unsubscribe', unsubscribePush);
router.post('/test-push', (req, res) => {
    const userId = req.user.userId;
    sendPushNotification(userId, 'Test Alert', 'This is a test notification from ClassConnect!')
        .then(() => res.json({ success: true, message: 'Test notification sent' }))
        .catch(err => res.status(500).json({ success: false, message: err.message }));
});



export default router;

