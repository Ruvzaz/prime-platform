
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});


export const sendRegistrationEmail = async (
  email: string,
  name: string,
  eventTitle: string,
  refCode: string,
  eventDate: Date,
  customSubject?: string | null,
  customBody?: string | null,
  attachmentUrl?: string | null,
  generateQr?: boolean
) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("GMAIL_USER or GMAIL_APP_PASSWORD not found. Skipping confirmation email.");
    return { success: false, error: "Missing Gmail credentials" };
  }

  try {
    const qrImageUrl = `https://quickchart.io/qr?text=${encodeURIComponent(refCode)}&size=200&margin=2`;
    
    let emailAttachments: any[] = [];
    if (attachmentUrl) {
        // Extract original filename from the R2 path
        const rawFilename = attachmentUrl.split('/').pop() || 'attachment.file';
        
        let filename = rawFilename;
        const parts = rawFilename.split('_');
        if (parts.length >= 3) {
            // New format: YYYYMMDD_UUID_filename.ext
            filename = parts.slice(2).join('_');
        } else {
            // Fallback for old format: uuid-filename.ext
            const dashIndex = rawFilename.indexOf('-');
            filename = dashIndex !== -1 ? rawFilename.substring(dashIndex + 1) : rawFilename;
        }
        
        emailAttachments.push({
            filename: filename,
            path: attachmentUrl // Nodemailer supports streaming directly from a URL path
        });
    }

    const emailSubject = customSubject && customSubject.trim() !== '' 
        ? customSubject 
        : `Registration Confirmed: ${eventTitle}`;

    const optionalCustomBodyHtml = customBody && customBody.trim() !== ''
        ? `<div style="margin: 20px 0; padding: 15px; background-color: #f9fafb; border-left: 4px solid #333; color: #444; white-space: pre-wrap; font-size: 14px;">${customBody}</div>`
        : '';
        
    const qrHtml = (generateQr === undefined || generateQr) ? `
          <div style="text-align: center; margin: 20px 0;">
            <p style="margin: 0 0 10px; font-size: 14px; color: #666;">Scan this QR Code at the event:</p>
            <img src="${qrImageUrl}" alt="QR Code: ${refCode}" width="200" height="200" style="border: 1px solid #eee; border-radius: 8px;" />
          </div>` : '';

    const info = await transporter.sendMail({
      from: `"ระบบลงทะเบียน" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: emailSubject,
      attachments: emailAttachments.length > 0 ? emailAttachments : undefined,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Registration Confirmed</h1>
          <p>สวัสดี ${name},</p>
          <p>คุณได้ลงทะเบียนสำหรับงาน <strong>${eventTitle}</strong> เรียบร้อยแล้ว</p>
          
          ${optionalCustomBodyHtml}
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #666;">Your Reference Code:</p>
            <h2 style="margin: 10px 0; font-family: monospace; font-size: 32px; letter-spacing: 2px;">${refCode}</h2>
          </div>

          ${qrHtml}

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

export const sendVerificationEmail = async (email: string, token: string) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return { success: false, error: "Missing Gmail credentials" };
  }
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verifyUrl = `${appUrl}/auth/verify?token=${token}`;
    const info = await transporter.sendMail({
      from: `"Prime Digital (CTF System)" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Verify your email for CTF Platform",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
          <h2 style="color: #333;">Email Verification</h2>
          <p>Please verify your email address to complete your registration for the Capture The Flag (CTF) platform.</p>
          <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold;">Verify Email Address</a>
          <p style="margin-top: 30px; font-size: 12px; color: #888;">If you didn't request this registration, you can safely ignore this email.</p>
        </div>
      `,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return { success: false, error };
  }
};

const escapeHtml = (unsafe: string) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const sendTeamCompleteEmail = async (
  teamName: string,
  organization: string,
  region: string,
  challengeName: string,
  members: { title?: string | null; firstName?: string | null; lastName?: string | null; email: string }[]
) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return { success: false, error: "Missing Gmail credentials" };
  }
  try {
    const toEmails = members.map(m => m.email).join(', ');
    const memberListHtml = members.map(m => {
      const title = escapeHtml(m.title || '');
      const fname = escapeHtml(m.firstName || '');
      const lname = escapeHtml(m.lastName || '');
      const email = escapeHtml(m.email);
      return `<li style="margin-bottom: 8px;">
        <strong>${title} ${fname} ${lname}</strong><br />
        <span style="color: #666; font-size: 14px;">${email}</span>
      </li>`;
    }).join('');

    const safeTeamName = escapeHtml(teamName);
    const safeOrg = escapeHtml(organization);
    const safeRegion = escapeHtml(region);
    const safeChallenge = escapeHtml(challengeName);

    const info = await transporter.sendMail({
      from: `"Prime Digital (CTF System)" <${process.env.GMAIL_USER}>`,
      to: toEmails,
      subject: `Team Complete: ${teamName} (${challengeName})`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #4f46e5; margin-bottom: 5px;">Team Registration Complete!</h2>
            <p style="color: #666; font-size: 14px; margin-top: 0;">Your team has reached the required 3 members.</p>
          </div>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #333; font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 8px;">Team Details</h3>
            <p style="margin: 8px 0;"><strong>Challenge:</strong> ${safeChallenge}</p>
            <p style="margin: 8px 0;"><strong>Team Name:</strong> ${safeTeamName}</p>
            <p style="margin: 8px 0;"><strong>Organization:</strong> ${safeOrg}</p>
            <p style="margin: 8px 0;"><strong>Region:</strong> ${safeRegion}</p>
          </div>

          <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #333; font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 8px;">Team Members</h3>
            <ul style="list-style-type: none; padding: 0; margin: 0;">
              ${memberListHtml}
            </ul>
          </div>
          
          <p style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">This is an automated message from the Prime Digital CTF Platform.</p>
        </div>
      `,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send team complete email:", error);
    return { success: false, error };
  }
};
