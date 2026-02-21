import mongoose from 'mongoose';

const pushSubscriptionSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    userObjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subscription: {
        endpoint: { type: String, required: true },
        expirationTime: { type: Number, default: null },
        keys: {
            p256dh: { type: String, required: true },
            auth: { type: String, required: true }
        }
    },
    deviceType: {
        type: String,
        default: 'mobile'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Avoid duplicate subscriptions for the same user and endpoint
pushSubscriptionSchema.index({ userId: 1, 'subscription.endpoint': 1 }, { unique: true });

export default mongoose.model('PushSubscription', pushSubscriptionSchema);
