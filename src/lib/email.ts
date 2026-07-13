import nodemailer from 'nodemailer';

// Helper to parse multiple email accounts from environment variables
function getEmailAccounts() {
  // Fallback to single user if GMAIL_USERS is not set
  const users = (process.env.GMAIL_USERS || process.env.GMAIL_USER || '').split(',').map(u => u.trim()).filter(Boolean);
  const passes = (process.env.GMAIL_APP_PASSWORDS || process.env.GMAIL_APP_PASSWORD || '').split(',').map(p => p.trim()).filter(Boolean);
  
  const accounts = [];
  for (let i = 0; i < Math.min(users.length, passes.length); i++) {
    accounts.push({ user: users[i], pass: passes[i] });
  }
  return accounts;
}

const emailAccounts = getEmailAccounts();
let currentAccountIndex = 0; // Remembers the currently active working account

async function sendMailWithFallback(mailOptions: any) {
  if (emailAccounts.length === 0) {
    console.warn("No Gmail credentials configured. Skipping email.");
    throw new Error("Missing Gmail credentials");
  }

  let lastError;
  const originalFrom = mailOptions.from || '"Prime Digital (CTF System)"';
  const fromName = originalFrom.split('<')[0].trim(); // Extract display name

  // Try each available account once
  for (let attempt = 0; attempt < emailAccounts.length; attempt++) {
    const account = emailAccounts[currentAccountIndex];
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: account.user,
        pass: account.pass,
      },
    });

    try {
      // Gmail requires the 'from' email to match the authenticated user
      const currentMailOptions = {
        ...mailOptions,
        from: `${fromName} <${account.user}>`
      };

      const info = await transporter.sendMail(currentMailOptions);
      console.log(`✅ Email sent successfully to ${mailOptions.to} via: ${account.user}`);
      return info;
    } catch (error: any) {
      console.warn(`⚠️ Failed to send email via ${account.user}:`, error.message);
      lastError = error;
      
      // If failed, immediately switch to the next backup account
      currentAccountIndex = (currentAccountIndex + 1) % emailAccounts.length;
      
      if (attempt < emailAccounts.length - 1) {
        console.log(`🔄 Switching to backup email account: ${emailAccounts[currentAccountIndex].user}`);
      }
    }
  }
  
  // If we loop through all accounts and they all fail
  console.error("❌ ALL EMAIL ACCOUNTS FAILED.");
  throw lastError || new Error("All email accounts failed to send.");
}

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
  try {
    const qrImageUrl = `https://quickchart.io/qr?text=${encodeURIComponent(refCode)}&size=200&margin=2`;
    
    let emailAttachments: any[] = [];
    if (attachmentUrl) {
        const rawFilename = attachmentUrl.split('/').pop() || 'attachment.file';
        let filename = rawFilename;
        const parts = rawFilename.split('_');
        if (parts.length >= 3) {
            filename = parts.slice(2).join('_');
        } else {
            const dashIndex = rawFilename.indexOf('-');
            filename = dashIndex !== -1 ? rawFilename.substring(dashIndex + 1) : rawFilename;
        }
        
        emailAttachments.push({
            filename: filename,
            path: attachmentUrl
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

    const info = await sendMailWithFallback({
      from: `"ระบบลงทะเบียน"`,
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
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send confirmation email:", error);
    return { success: false, error };
  }
};

export const sendVerificationEmail = async (email: string, token: string) => {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verifyUrl = `${appUrl}/auth/verify?token=${token}`;
    
    const info = await sendMailWithFallback({
      from: `"Prime Digital (CTF System)"`,
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

    const info = await sendMailWithFallback({
      from: `"Prime Digital (CTF System)"`,
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

export const sendPasswordResetEmail = async (email: string, token: string) => {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/auth/reset-password?token=${token}`;
    
    const info = await sendMailWithFallback({
      from: `"Prime Digital (CTF System)"`,
      to: email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>We received a request to reset the password for the account associated with this email address.</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold;">Reset Password</a>
          <p style="margin-top: 30px; font-size: 12px; color: #888;">If you didn't request a password reset, you can safely ignore this email. The link will expire in 1 hour.</p>
        </div>
      `,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return { success: false, error };
  }
};

