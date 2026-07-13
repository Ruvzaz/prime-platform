'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendVerificationEmail } from '@/lib/email';

const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().optional().nullable(),
  username: z.string().optional().nullable(),
  institution: z.string().optional().nullable(),
  educationLevel: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
});

export async function adminUpdateUser(userId: string, formData: FormData) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
      return { error: 'Unauthorized: Admin access required.' };
    }

    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phoneNumber: formData.get('phoneNumber') as string || null,
      username: formData.get('username') as string || null,
      institution: formData.get('institution') as string || null,
      educationLevel: formData.get('educationLevel') as string || null,
      gender: formData.get('gender') as string || null,
      password: formData.get('password') as string || '',
    };

    const validatedData = updateUserSchema.parse(data);

    // Check if email is being changed and if it already exists
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (existingUser?.email !== validatedData.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email: validatedData.email } });
      if (emailTaken) {
        return { error: 'Email address is already in use by another account.' };
      }
    }

    if (validatedData.username && existingUser?.username !== validatedData.username) {
      const usernameTaken = await prisma.user.findFirst({ where: { username: { equals: validatedData.username, mode: 'insensitive' } } });
      if (usernameTaken) {
        return { error: 'Username is already taken.' };
      }
    }

    const updatePayload: any = {
      name: validatedData.name,
      email: validatedData.email,
      phoneNumber: validatedData.phoneNumber,
      username: validatedData.username,
      institution: validatedData.institution,
      educationLevel: validatedData.educationLevel,
      gender: validatedData.gender,
    };

    if (validatedData.password) {
      updatePayload.password = await bcrypt.hash(validatedData.password, 10);
    }

    await prisma.user.update({
      where: { id: userId },
      data: updatePayload
    });

    revalidatePath('/admin/challenges');
    revalidatePath('/admin/accounts');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating user:', error);
    if (error instanceof z.ZodError) {
      return { error: (error as any).errors[0].message };
    }
    return { error: error.message || 'Failed to update user' };
  }
}

export async function adminResendVerificationEmail(userId: string) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
      return { error: 'Unauthorized: Admin access required.' };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { error: 'User not found.' };
    if (user.emailVerified) return { error: 'User is already verified.' };

    // Rate Limit / Spam protection logic can be added if needed, but admins probably won't spam
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

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

    await sendVerificationEmail(user.email, token);

    return { success: true };
  } catch (error: any) {
    console.error('Error resending verification email:', error);
    return { error: 'Failed to resend verification email' };
  }
}
