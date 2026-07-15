'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { sendVerificationEmail, sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';
import { signIn, signOut, auth } from '@/auth';
import { AuthError } from 'next-auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

const registerSchema = z.object({
  title: z.string().min(1, "Title is required").max(50),
  firstName: z.string().min(2, "First name must be at least 2 characters").max(100),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(100),
  gender: z.string().min(1, "Gender is required").max(20),
  institution: z.string().min(1, "Institution is required").max(150),
  educationLevel: z.string().min(1, "Education level is required").max(100),
  phoneNumber: z.string().min(9, "Valid phone number is required").max(10, "Phone number must not exceed 10 digits"),
  email: z.string().email("Invalid email address").max(150),
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  password: z.string().min(8, "Password must be at least 8 characters (Security Policy)")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const profileCompleteSchema = z.object({
  title: z.string().min(1, "Title is required").max(50),
  firstName: z.string().min(2, "First name must be at least 2 characters").max(100),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(100),
  gender: z.string().min(1, "Gender is required").max(20),
  institution: z.string().min(1, "Institution is required").max(150),
  educationLevel: z.string().min(1, "Education level is required").max(100),
  phoneNumber: z.string().min(9, "Valid phone number is required").max(10, "Phone number must not exceed 10 digits"),
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
});

const updateProfileSchema = profileCompleteSchema.omit({ username: true });

export async function acceptPrivacyPolicy() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { privacyAcceptedAt: new Date() },
    });
    revalidatePath('/challenge');
    return { success: true };
  } catch (error) {
    console.error("Error accepting privacy policy:", error);
    return { error: "Failed to accept privacy policy" };
  }
}

export async function registerParticipant(prevState: any, formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries());
    const validated = registerSchema.safeParse(rawData);

    if (!validated.success) {
      return { 
        error: "Validation failed", 
        details: validated.error.flatten().fieldErrors,
        data: rawData
      };
    }

    // --- RATE LIMITING ---
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || '127.0.0.1';
    
    const recentAttempts = await prisma.activityLog.count({
      where: {
        type: 'RATE_LIMIT',
        action: 'REGISTER_EMAIL',
        description: ip,
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // 1 Hour window
        }
      }
    });

    if (recentAttempts >= 20) {
      return { 
        error: "Too many registration attempts from this IP address. Please try again later.",
        data: rawData
      };
    }
    // ---------------------

    const { title, firstName, lastName, gender, institution, educationLevel, phoneNumber, password, username } = validated.data;
    const email = validated.data.email.toLowerCase();
    const name = `${firstName} ${lastName}`;

    // Security Check 1: Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { 
        OR: [
          { email },
          { username: { equals: username, mode: 'insensitive' } }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return { error: "Email is already registered.", data: rawData };
      }
      if (existingUser.username?.toLowerCase() === username.toLowerCase()) {
        return { error: "Username is already taken.", data: rawData };
      }
    }

    // Security Check 2: Hash password with strong salt rounds (bcryptjs default is 10, we can use 12 for better security)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with USER role
    const user = await prisma.user.create({
      data: {
        title,
        firstName,
        lastName,
        name,
        gender,
        institution,
        educationLevel,
        phoneNumber,
        username,
        email,
        password: hashedPassword,
        role: "USER"
      }
    });

    // Generate Verification Token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires
      }
    });

    // Send Email
    await sendVerificationEmail(email, token);

    // Log the action to deduct rate limit quota
    await prisma.activityLog.create({
      data: {
        type: 'RATE_LIMIT',
        action: 'REGISTER_EMAIL',
        description: ip,
        metadata: { email }
      }
    });

    return { success: true, message: "Registration successful. Please check your email to verify your account." };
  } catch (error) {
    console.error("Registration error:", error);
    return { error: "An unexpected error occurred during registration." };
  }
}

export async function verifyEmailToken(token: string) {
  try {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token }
    });

    if (!verificationToken) {
      return { error: "Invalid verification token." };
    }

    if (new Date() > verificationToken.expires) {
      return { error: "Verification token has expired. Please register again." };
    }

    // Mark user as verified
    const user = await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() }
    });

    // Delete token after successful use
    await prisma.verificationToken.delete({
      where: { token }
    });

    return { success: true, user };
  } catch (error) {
    console.error("Verification error:", error);
    return { error: "An unexpected error occurred during verification." };
  }
}

export async function participantLogin(prevState: any, formData: FormData) {
  try {
    const callbackUrl = formData.get('callbackUrl') as string || '/challenge';
    await signIn('credentials', { ...Object.fromEntries(formData), redirectTo: callbackUrl });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Invalid email/password or email not verified.' };
        default:
          return { error: 'Something went wrong.' };
      }
    }
    if (error instanceof Error && error.message === 'Email not verified') {
      return { error: 'Please verify your email address before logging in.' };
    }
    throw error;
  }
}

export async function participantGoogleLogin(formData: FormData) {
  const callbackUrl = formData.get('callbackUrl') as string || '/challenge';
  await signIn('google', { redirectTo: callbackUrl });
}

export async function participantLogout() {
  await signOut({ redirectTo: '/auth/login' });
}

export async function completeGoogleProfile(prevState: any, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const rawData = Object.fromEntries(formData.entries());
    const validated = profileCompleteSchema.safeParse(rawData);

    if (!validated.success) {
      return { 
        error: "Validation failed", 
        details: validated.error.flatten().fieldErrors 
      };
    }

    const { title, firstName, lastName, gender, institution, educationLevel, phoneNumber, username } = validated.data;
    const name = `${firstName} ${lastName}`;

    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: { 
          username: { equals: username, mode: 'insensitive' },
          id: { not: session.user.id }
        }
      });

      if (existingUser) {
        return { error: "Username is already taken." };
      }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        title,
        firstName,
        lastName,
        name,
        gender,
        institution,
        educationLevel,
        phoneNumber,
        username
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Profile update error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function updateParticipantProfile(prevState: any, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const rawData = Object.fromEntries(formData.entries());
    const validated = updateProfileSchema.safeParse(rawData);

    if (!validated.success) {
      return { 
        error: "Validation failed", 
        details: validated.error.flatten().fieldErrors 
      };
    }

    const { title, firstName, lastName, gender, institution, educationLevel, phoneNumber } = validated.data;
    const name = `${firstName} ${lastName}`;

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        title,
        firstName,
        lastName,
        name,
        gender,
        institution,
        educationLevel,
        phoneNumber
      }
    });

    revalidatePath('/challenge/profile');
    revalidatePath('/challenge');

    return { success: true, message: "Profile updated successfully!" };
  } catch (error) {
    console.error("Profile update error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function requestPasswordReset(prevState: any, formData: FormData) {
  try {
    const email = formData.get('email') as string;
    if (!email) return { error: "Email is required" };

    // --- RATE LIMITING ---
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || '127.0.0.1';
    
    const recentResets = await prisma.activityLog.count({
      where: {
        type: 'RATE_LIMIT',
        action: 'PASSWORD_RESET',
        description: ip,
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // 1 Hour window
        }
      }
    });

    if (recentResets >= 10) {
      return { error: "Too many password reset requests from this IP address. Please try again later." };
    }
    // ---------------------

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      // Return success even if user not found to prevent email enumeration
      return { success: true, message: "If an account exists, a password reset link has been sent to the email." };
    }

    // Rate Limiting Check: Prevent spamming emails
    const existingToken = await prisma.verificationToken.findFirst({
      where: { identifier: user.email }
    });

    if (existingToken) {
      // If the token expires in more than 59 minutes, it was created less than 1 minute ago
      const timeRemainingMs = existingToken.expires.getTime() - Date.now();
      if (timeRemainingMs > 59 * 60 * 1000) {
        return { error: "Please wait 60 seconds before requesting another reset link." };
      }
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    // Delete existing tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: user.email }
    });

    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token,
        expires
      }
    });

    await sendPasswordResetEmail(user.email, token);

    // Log the action to deduct rate limit quota
    await prisma.activityLog.create({
      data: {
        type: 'RATE_LIMIT',
        action: 'PASSWORD_RESET',
        description: ip,
        metadata: { email: user.email }
      }
    });

    return { success: true, message: "If an account exists, a password reset link has been sent to the email." };
  } catch (error) {
    console.error("Password reset request error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function resetPasswordWithToken(prevState: any, formData: FormData) {
  try {
    const token = formData.get('token') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!token) return { error: "Invalid token" };
    if (!password) return { error: "Password is required" };
    if (password !== confirmPassword) return { error: "Passwords do not match" };

    // Validate password strength
    if (password.length < 8) return { error: "Password must be at least 8 characters" };
    if (!/[a-z]/.test(password)) return { error: "Password must contain at least one lowercase letter" };
    if (!/[A-Z]/.test(password)) return { error: "Password must contain at least one uppercase letter" };
    if (!/[0-9]/.test(password)) return { error: "Password must contain at least one number" };

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token }
    });

    if (!verificationToken) {
      return { error: "Invalid or expired reset token." };
    }

    if (new Date() > verificationToken.expires) {
      return { error: "Reset token has expired. Please request a new one." };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { password: hashedPassword }
    });

    await prisma.verificationToken.delete({
      where: { token }
    });

    return { success: true, message: "Password reset successful! You can now log in." };
  } catch (error) {
    console.error("Password reset error:", error);
    return { error: "An unexpected error occurred." };
  }
}

