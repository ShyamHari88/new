import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['teacher', 'student', 'admin'], required: true },

    // Student specific
    rollNumber: { type: String, sparse: true, unique: true },
    studentId: { type: String },
    year: { type: Number },
    section: { type: String },
    currentSemester: { type: Number },

    // Teacher specific
    teacherId: { type: String, sparse: true, unique: true },

    // Common
    departmentId: { type: String },

    // Password reset
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },

    isActive: { type: Boolean, default: true },
    isFirstLogin: { type: Boolean, default: true },
    lastLogin: { type: Date }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Password comparison
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Generate password reset token
userSchema.methods.getResetPasswordToken = function () {
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash and set to resetPasswordToken field
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set expire (1 hour)
    this.resetPasswordExpire = Date.now() + 60 * 60 * 1000;

    return resetToken;
};

export default mongoose.model('User', userSchema);
