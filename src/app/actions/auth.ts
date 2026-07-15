'use server';
 
import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';
import { headers } from 'next/headers';
import { getRateLimit } from '@/lib/rate-limit';
import { sendDiscordLog } from '@/lib/discord-logger';

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || 'unknown_ip';
    
    // Max 5 attempts per 5 minutes for Admin login
    const isAllowed = await getRateLimit(`admin_login_${ip}`, 5, 300000);
    if (!isAllowed) {
      await sendDiscordLog({
        category: 'SECURITY',
        title: 'Admin Bruteforce Attempt Detected',
        description: `IP **${ip}** has exceeded the admin login rate limit (5 attempts/5min).`,
        color: 0xff0000,
      });
      return 'Too many login attempts. Please try again later.';
    }

    const callbackUrl = formData.get('callbackUrl') as string || '/';
    await signIn('credentials', { ...Object.fromEntries(formData), redirectTo: callbackUrl });
  } catch (error) {
    if (error instanceof AuthError) {
      const email = formData.get('email') as string;
      const headersList = await headers();
      const ip = headersList.get('x-forwarded-for') || 'unknown_ip';

      switch (error.type) {
        case 'CredentialsSignin':
          // Log failed admin login attempt
          await sendDiscordLog({
            category: 'SECURITY',
            title: 'Failed Admin Login Attempt',
            description: `IP **${ip}** attempted to login to Admin with email: **${email || 'UNKNOWN'}**`,
            color: 0xffa500, // Orange
          });
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

export async function logout() {
    await signOut({ redirectTo: '/admin/login' });
}
