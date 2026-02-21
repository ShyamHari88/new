import api from '@/services/api';

const VAPID_PUBLIC_KEY = 'BB9hbDE-AzHzIxCbT98QrcnsQ3UgylqXG3JSL_uwJlvxRu0SisK0BOC7RdxaNdPSFDQacDHVOdYkXWd5-DX9_Lo';

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.error('This browser does not support notifications');
        return false;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        return false;
    }

    return await subscribeUserToPush();
}

async function subscribeUserToPush() {
    try {
        const registration = await navigator.serviceWorker.ready;

        // Check for existing subscription
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            // Create new subscription
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });
        }

        // Send subscription to backend
        await api.post('/notifications/subscribe', {
            subscription,
            deviceType: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
        });

        return true;
    } catch (error) {
        console.error('Failed to subscribe to push notifications:', error);
        return false;
    }
}

export async function unsubscribeUserFromPush() {
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            // Notify backend before unsubscribing
            await api.post('/notifications/unsubscribe', {
                endpoint: subscription.endpoint
            });

            // Native unsubscribe
            await subscription.unsubscribe();
        }
        return true;
    } catch (error) {
        console.error('Failed to unsubscribe from push notifications:', error);
        return false;
    }
}

export async function checkPushSubscriptionStatus() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return 'unsupported';
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
        return 'subscribed';
    }

    return Notification.permission === 'denied' ? 'blocked' : 'unsubscribed';
}
