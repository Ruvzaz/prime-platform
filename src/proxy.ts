import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

const { auth } = NextAuth(authConfig);

export function proxy(...args: Parameters<typeof auth>) {
  return auth(...args);
}

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/proxy
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
