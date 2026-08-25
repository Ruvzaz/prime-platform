import nodemailer from 'nodemailer';
import { sendDiscordLog } from '@/lib/discord-logger';

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

export function getAvailableEmailAccounts(): string[] {
  return emailAccounts.map(a => a.user);
}

async function sendMailWithFallback(mailOptions: any, preferredSenderEmail?: string | null) {
  if (emailAccounts.length === 0) {
    console.warn("No Gmail credentials configured. Skipping email.");
    throw new Error("Missing Gmail credentials");
  }

  // Determine account order to attempt
  let orderedAccounts = [...emailAccounts];
  if (preferredSenderEmail) {
    const preferredIndex = emailAccounts.findIndex(a => a.user.toLowerCase() === preferredSenderEmail.trim().toLowerCase());
    if (preferredIndex !== -1) {
      const preferredAcc = emailAccounts[preferredIndex];
      orderedAccounts = [preferredAcc, ...emailAccounts.filter((_, idx) => idx !== preferredIndex)];
      console.log(`📧 Preferred sender account set: ${preferredAcc.user}`);
    } else {
      console.warn(`⚠️ Preferred sender email "${preferredSenderEmail}" is not found in configured accounts:`, emailAccounts.map(a => a.user));
    }
  }

  let lastError;
  const originalFrom = mailOptions.from || '"Prime Digital (CTF System)"';
  const fromName = originalFrom.split('<')[0].trim(); // Extract display name

  // Try each available account once
  for (let attempt = 0; attempt < orderedAccounts.length; attempt++) {
    const account = orderedAccounts[attempt];
    
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
      
      // Send Discord Log for successful email delivery
      await sendDiscordLog({
        category: 'EMAIL',
        title: '✅ Email Delivery Success',
        description: `Successfully sent email to **${mailOptions.to}**\n**Subject:** ${mailOptions.subject}`,
        color: 0x2ecc71, // Green
        fields: [
          { name: 'Sender Account', value: account.user, inline: true }
        ]
      });
      
      return info;
    } catch (error: any) {
      console.warn(`⚠️ Failed to send email via ${account.user}:`, error.message);
      lastError = error;
      
      if (attempt < orderedAccounts.length - 1) {
        console.log(`🔄 Switching to backup email account: ${orderedAccounts[attempt + 1].user}`);
      }
    }
  }
  
  // If we loop through all accounts and they all fail
  console.error("❌ ALL EMAIL ACCOUNTS FAILED.");
  
  // Send Discord Log for complete email failure
  await sendDiscordLog({
    category: 'EMAIL',
    title: '❌ Email Delivery FAILED',
    description: `Failed to send email to **${mailOptions.to}** after trying all backup accounts.\n**Subject:** ${mailOptions.subject}`,
    color: 0xff0000, // Red
    fields: [
      { name: 'Error', value: lastError?.message || 'Unknown error' }
    ]
  });
  
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
  generateQr?: boolean,
  senderEmail?: string | null
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
    }, senderEmail);
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
      from: `"NCSA CTF System"`,
      to: email,
      subject: "Verify your email for NCSA CTF",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; background-color: #ffffff; border: 2px solid #e0e7ff; border-radius: 6px; padding: 40px;">
          <h2 style="margin: 0 0 20px 0; font-size: 24px; font-weight: bold; color: #000000;">Thailand Cyber Top Talent 2026</h2>
          <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #333333;">
            สวัสดีครับ,<br><br>กรุณายืนยันอีเมลของคุณเพื่อเสร็จสิ้นการสมัครเข้าร่วมการแข่งขัน
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="display: inline-block; padding: 14px 40px; background-color: transparent; color: #5c73f2; text-decoration: none; border: 2px solid #5c73f2; border-radius: 6px; font-size: 16px; font-weight: bold;">Verify Email Address</a>
          </div>
          <p style="margin-top: 30px; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            หากคุณไม่ได้ทำการลงทะเบียน กรุณาเพิกเฉยต่ออีเมลฉบับนี้
          </p>
          <div style="margin-top: 20px; font-size: 13px; color: #475569; background-color: #f8fafc; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0;">
            <p style="margin: 0 0 5px 0;"><strong style="color: #0f172a;">Contact info</strong></p>
            <p style="margin: 0 0 5px 0;">Line OA : <span style="color: #059669; font-weight: bold;">@thnca</span></p>
            <p style="margin: 0;">ติดต่อภายในระยะเวลาทำการ 09.00-17.00 น.</p>
          </div>
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
      return `<li style="margin-bottom: 12px;">
        <strong style="color: #0f172a; font-size: 15px;">${title} ${fname} ${lname}</strong><br />
        <span style="color: #64748b; font-size: 13px;">${email}</span>
      </li>`;
    }).join('');

    const safeTeamName = escapeHtml(teamName);
    const safeOrg = escapeHtml(organization);
    const safeRegion = escapeHtml(region);
    const safeChallenge = escapeHtml(challengeName);

    const info = await sendMailWithFallback({
      from: `"NCSA CTF System"`,
      to: toEmails,
      subject: `Team Complete: ${teamName} (${challengeName})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; background-color: #ffffff; border: 2px solid #e0e7ff; border-radius: 6px; padding: 40px;">
          <h2 style="margin: 0 0 10px 0; font-size: 24px; font-weight: bold; color: #000000; text-align: center;">Team Registration Complete!</h2>
          <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 1.6; color: #333333; text-align: center;">
            ยินดีด้วย! ทีมของคุณมีสมาชิกครบตามจำนวนที่กำหนดแล้ว
          </p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #0f172a; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">ข้อมูลทีม (Team Details)</h3>
            <p style="margin: 8px 0; color: #475569;"><strong style="color: #333333;">รายการแข่งขัน:</strong> ${safeChallenge}</p>
            <p style="margin: 8px 0; color: #475569;"><strong style="color: #333333;">ชื่อทีม:</strong> ${safeTeamName}</p>
            <p style="margin: 8px 0; color: #475569;"><strong style="color: #333333;">หน่วยงาน:</strong> ${safeOrg}</p>
            <p style="margin: 8px 0; color: #475569;"><strong style="color: #333333;">ภูมิภาค:</strong> ${safeRegion}</p>
          </div>

          <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; border: 1px solid #e2e8f0;">
            <h3 style="margin-top: 0; color: #0f172a; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">สมาชิก (Team Members)</h3>
            <ul style="list-style-type: none; padding: 0; margin: 0;">
              ${memberListHtml}
            </ul>
          </div>
          
          <p style="margin-top: 30px; font-size: 13px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            อีเมลนี้ส่งอัตโนมัติจากระบบ Thailand Cyber Top Talent
          </p>
          
          <div style="margin-top: 20px; font-size: 13px; color: #475569; background-color: #f8fafc; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0; text-align: left;">
            <p style="margin: 0 0 5px 0;"><strong style="color: #0f172a;">Contact info</strong></p>
            <p style="margin: 0 0 5px 0;">Line OA : <span style="color: #059669; font-weight: bold;">@thnca</span></p>
            <p style="margin: 0;">ติดต่อภายในระยะเวลาทำการ 09.00-17.00 น.</p>
          </div>
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
      from: `"NCSA CTF System"`,
      to: email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; background-color: #ffffff; border: 2px solid #e0e7ff; border-radius: 6px; padding: 40px;">
          <h2 style="margin: 0 0 20px 0; font-size: 24px; font-weight: bold; color: #000000;">Thailand Cyber Top Talent 2026</h2>
          <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #333333;">
            เราได้รับคำขอให้รีเซ็ตรหัสผ่านสำหรับบัญชีที่เชื่อมโยงกับอีเมลนี้
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 14px 40px; background-color: transparent; color: #5c73f2; text-decoration: none; border: 2px solid #5c73f2; border-radius: 6px; font-size: 16px; font-weight: bold;">Reset Password</a>
          </div>
          <p style="margin-top: 30px; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            หากคุณไม่ได้ทำรายการนี้ กรุณาเพิกเฉยต่ออีเมลฉบับนี้ ลิงก์จะมีอายุการใช้งาน 1 ชั่วโมง
          </p>
          <div style="margin-top: 20px; font-size: 13px; color: #475569; background-color: #f8fafc; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0;">
            <p style="margin: 0 0 5px 0;"><strong style="color: #0f172a;">Contact info</strong></p>
            <p style="margin: 0 0 5px 0;">Line OA : <span style="color: #059669; font-weight: bold;">@thnca</span></p>
            <p style="margin: 0;">ติดต่อภายในระยะเวลาทำการ 09.00-17.00 น.</p>
          </div>
        </div>
      `,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return { success: false, error };
  }
};

