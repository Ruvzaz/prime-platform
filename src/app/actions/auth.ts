'use server';
 
import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';
 
export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    const callbackUrl = formData.get('callbackUrl') as string || '/';
    await signIn('credentials', { ...Object.fromEntries(formData), redirectTo: callbackUrl });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

export async function logout() {
    await signOut({ redirectTo: '/login' });
}
