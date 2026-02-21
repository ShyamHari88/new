import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription.js';
import dotenv from 'dotenv';

dotenv.config();

// Configure web-push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    console.log('[PUSH] ✅ VAPID keys found. Push notification service ready.');
    webpush.setVapidDetails(
        process.env.VAPID_EMAIL || 'mailto:admin@classconnect.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
} else {
    console.warn('[PUSH] ⚠️ VAPID keys missing! Push notifications will not work.');
}


export const sendPushNotification = async (userId, title, body, data = {}) => {
    try {
        // Find all subscriptions for this user
        const subscriptions = await PushSubscription.find({ userId: userId });

        console.log(`[PUSH] Searching for subscriptions for User: ${userId}`);

        if (!subscriptions || subscriptions.length === 0) {
            console.log(`[PUSH] ❌ No push subscriptions found for user ${userId} in database.`);
            return;
        }

        console.log(`[PUSH] ✅ Found ${subscriptions.length} subscription(s) for user ${userId}. Sending now...`);


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
                .then(result => {
                    console.log(`[PUSH] 🚀 Success! Status: ${result.statusCode} for User: ${userId}`);
                })
                .catch(err => {
                    console.error(`[PUSH] ❌ Failed! Status: ${err.statusCode} for User: ${userId}`);
                    console.error(`[PUSH] Error Details: ${err.body || err.message}`);

                    // If subscription has expired or is invalid, remove it
                    if (err.statusCode === 404 || err.statusCode === 410) {
                        console.log(`[PUSH] 🗑️ Removing expired subscription for user ${userId}`);
                        return PushSubscription.deleteOne({ _id: sub._id });
                    }
                });
        });

        await Promise.all(notificationPromises);
        console.log(`[PUSH] Finished attempting delivery to ${subscriptions.length} devices.`);

    } catch (error) {
        console.error('Push notification service error:', error);
    }
};
