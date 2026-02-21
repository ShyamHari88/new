import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription.js';
import dotenv from 'dotenv';

dotenv.config();

// Configure web-push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        process.env.VAPID_EMAIL || 'mailto:admin@classconnect.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

export const sendPushNotification = async (userId, title, body, data = {}) => {
    try {
        // Find all subscriptions for this user
        const subscriptions = await PushSubscription.find({ userId: userId });

        if (!subscriptions || subscriptions.length === 0) {
            console.log(`No push subscriptions found for user ${userId}`);
            return;
        }

        const payload = JSON.stringify({
            title,
            body,
            icon: '/easy-attendance-logo.png',
            badge: '/easy-attendance-logo.png',
            data: {
                url: data.url || '/',
                ...data
            }
        });

        // Send to all registered devices for this user
        const notificationPromises = subscriptions.map(sub => {
            return webpush.sendNotification(sub.subscription, payload)
                .catch(err => {
                    console.error('Error sending push notification:', err.statusCode);
                    // If subscription has expired or is invalid, remove it
                    if (err.statusCode === 404 || err.statusCode === 410) {
                        return PushSubscription.deleteOne({ _id: sub._id });
                    }
                });
        });

        await Promise.all(notificationPromises);
        console.log(`Push notifications sent to ${subscriptions.length} devices for user ${userId}`);
    } catch (error) {
        console.error('Push notification service error:', error);
    }
};
