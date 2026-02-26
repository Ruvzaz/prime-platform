
import nodemailer from 'nodemailer';

// Create a transporter using Gmail SMTP
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
  attachmentUrl?: string | null
) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("GMAIL_USER or GMAIL_APP_PASSWORD not found. Skipping confirmation email.");
    return { success: false, error: "Missing Gmail credentials" };
  }

  try {
    const qrImageUrl = `https://quickchart.io/qr?text=${encodeURIComponent(refCode)}&size=200&margin=2`;
    
    let emailAttachments: any[] = [];
    if (attachmentUrl) {
        // Extract original filename after the UUID prefix: folder/uuid-filename.ext
        const rawFilename = attachmentUrl.split('/').pop() || 'attachment.file';
        // Assuming format is UUID-realfilename.ext
        const dashIndex = rawFilename.indexOf('-');
        const filename = dashIndex !== -1 ? rawFilename.substring(dashIndex + 1) : rawFilename;
        
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

    const info = await transporter.sendMail({
      from: `"ระบบลงทะเบียน" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: emailSubject,
      attachments: emailAttachments.length > 0 ? emailAttachments : undefined,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Registration Confirmed</h1>
          <p>Hi ${name},</p>
          <p>You are successfully registered for <strong>${eventTitle}</strong>.</p>
          
          ${optionalCustomBodyHtml}
          
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
