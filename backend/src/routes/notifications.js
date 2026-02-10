
import express from 'express';
import {
    getMyNotifications,
    createNotification,
    markAsRead,
    markAllRead
} from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getMyNotifications);
router.post('/', createNotification);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllRead);

export default router;
