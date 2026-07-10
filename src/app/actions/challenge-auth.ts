'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { sendVerificationEmail } from '@/lib/email';
import crypto from 'crypto';
import { signIn, signOut, auth } from '@/auth';
import { AuthError } from 'next-auth';

const registerSchema = z.object({
  title: z.string().min(1, "Title is required").max(50),
  firstName: z.string().min(2, "First name must be at least 2 characters").max(100),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(100),
  gender: z.string().min(1, "Gender is required").max(20),
  institution: z.string().min(1, "Institution is required").max(150),
  educationLevel: z.string().min(1, "Education level is required").max(100),
  phoneNumber: z.string().min(9, "Valid phone number is required").max(20),
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

const updateProfileSchema = z.object({
  title: z.string().min(1, "Title is required").max(50),
  firstName: z.string().min(2, "First name must be at least 2 characters").max(100),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(100),
  gender: z.string().min(1, "Gender is required").max(20),
  institution: z.string().min(1, "Institution is required").max(150),
  educationLevel: z.string().min(1, "Education level is required").max(100),
  phoneNumber: z.string().min(9, "Valid phone number is required").max(20),
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
});

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
    const validated = updateProfileSchema.safeParse(rawData);

    if (!validated.success) {
      return { 
        error: "Validation failed", 
        details: validated.error.flatten().fieldErrors 
      };
    }

    const { title, firstName, lastName, gender, institution, educationLevel, phoneNumber, username } = validated.data;
    const name = `${firstName} ${lastName}`;

    const existingUser = await prisma.user.findFirst({
      where: { 
        username: { equals: username, mode: 'insensitive' },
        id: { not: session.user.id }
      }
    });

    if (existingUser) {
      return { error: "Username is already taken." };
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

    const { title, firstName, lastName, gender, institution, educationLevel, phoneNumber, username } = validated.data;
    const name = `${firstName} ${lastName}`;

    const existingUser = await prisma.user.findFirst({
      where: { 
        username: { equals: username, mode: 'insensitive' },
        id: { not: session.user.id }
      }
    });

    if (existingUser) {
      return { error: "Username is already taken." };
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

    return { success: true, message: "Profile updated successfully!" };
  } catch (error) {
    console.error("Profile update error:", error);
    return { error: "An unexpected error occurred." };
  }
}
