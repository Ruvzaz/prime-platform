
import nodemailer from 'nodemailer';

// Create a transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export const sendVerificationEmail = async (email: string, verifyUrl: string) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("GMAIL_USER or GMAIL_APP_PASSWORD not found. Skipping verification email.");
    return { success: false, error: "Missing Gmail credentials" };
  }

  try {
    const info = await transporter.sendMail({
      from: `"Prime Platform" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Verify your email address",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Verify your email</h1>
          <p>Click the button below to verify your email address and complete your registration.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email</a>
          </div>
          <p style="color: #666; font-size: 14px;">If you didn't request this, you can ignore this email.</p>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">Link: <a href="${verifyUrl}">${verifyUrl}</a></p>
        </div>
      `,
    });
    console.log("Verification email sent: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return { success: false, error };
  }
};

export const sendRegistrationEmail = async (
  email: string,
  name: string,
  eventTitle: string,
  refCode: string,
  eventDate: Date
) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("GMAIL_USER or GMAIL_APP_PASSWORD not found. Skipping confirmation email.");
    return { success: false, error: "Missing Gmail credentials" };
  }

  try {
    const qrImageUrl = `https://quickchart.io/qr?text=${encodeURIComponent(refCode)}&size=200&margin=2`;
    
    const info = await transporter.sendMail({
      from: `"Prime Platform" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Registration Confirmed: ${eventTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Registration Confirmed</h1>
          <p>Hi ${name},</p>
          <p>You are successfully registered for <strong>${eventTitle}</strong>.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #666;">Your Reference Code:</p>
            <h2 style="margin: 10px 0; font-family: monospace; font-size: 32px; letter-spacing: 2px;">${refCode}</h2>
          </div>

          <div style="text-align: center; margin: 20px 0;">
            <p style="margin: 0 0 10px; font-size: 14px; color: #666;">Scan this QR Code at the event:</p>
            <img src="${qrImageUrl}" alt="QR Code: ${refCode}" width="200" height="200" style="border: 1px solid #eee; border-radius: 8px;" />
          </div>

          <p><strong>Date:</strong> ${eventDate.toLocaleDateString()} at ${eventDate.toLocaleTimeString()}</p>
        </div>
      `,
    });
    console.log("Confirmation email sent: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send confirmation email:", error);
    return { success: false, error };
  }
};
