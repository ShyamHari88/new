import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD ||
    process.env.EMAIL_USER === 'your-email@gmail.com' ||
    process.env.EMAIL_PASSWORD === 'your-app-password') {
    console.log('⚠️  Email service not configured - skipping email');
    return null;
  }

  return nodemailer.createTransporter({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Send password reset email
export const sendPasswordResetEmail = async (email, resetToken, userName) => {
  try {
    const transporter = createTransporter();

    // If email is not configured, return early
    if (!transporter) {
      return { success: false, error: 'Email service not configured' };
    }

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset-password/${resetToken}`;

    const mailOptions = {
      from: `"Class Connect" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request - Class Connect',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Password Reset Request</h2>
          <p>Hello ${userName},</p>
          <p>You requested to reset your password for Class Connect. Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="color: #666; word-break: break-all;">${resetUrl}</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            This link will expire in 1 hour.<br>
            If you didn't request this, please ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            Best regards,<br>
            Class Connect Team
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

// Send welcome email
export const sendWelcomeEmail = async (email, userName, role) => {
  try {
    const transporter = createTransporter();

    // If email is not configured, return early
    if (!transporter) {
      return { success: false, error: 'Email service not configured' };
    }

    const mailOptions = {
      from: `"Class Connect" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Class Connect!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to Class Connect!</h2>
          <p>Hello ${userName},</p>
          <p>Your ${role} account has been successfully created.</p>
          <p>You can now login to access your dashboard at:</p>
          <p><a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}" style="color: #2563eb;">Class Connect Portal</a></p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            Best regards,<br>
            Class Connect Team
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};
// Send absence notification
export const sendAbsenceNotification = async (email, studentName, subject, date, period) => {
  try {
    const transporter = createTransporter();

    // If email is not configured, return early
    if (!transporter) {
      return { success: false, error: 'Email service not configured' };
    }

    const mailOptions = {
      from: `"Attendance Portal" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Absence Alert: ${studentName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #ef4444;">Absence Notification</h2>
          <p>Dear Parent/Student,</p>
          <p>This is to inform you that <b>${studentName}</b> was marked <b>ABSENT</b> today.</p>
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><b>Subject:</b> ${subject}</p>
            <p style="margin: 5px 0;"><b>Date:</b> ${date}</p>
            <p style="margin: 5px 0;"><b>Period:</b> ${period}</p>
          </div>
          <p>Regular attendance is crucial for academic success. If this absence was unintentional, please contact the department office.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            Best regards,<br>
            College Attendance Management System
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};
