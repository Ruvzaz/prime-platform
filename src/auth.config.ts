import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const userRole = auth?.user?.role;
      
      const isAdminRoute = nextUrl.pathname.startsWith('/admin') && nextUrl.pathname !== '/admin/login';
      const isStaffRoute = nextUrl.pathname.startsWith('/check-in');
      const isChallengeRoute = nextUrl.pathname.startsWith('/challenge/') && nextUrl.pathname.length > 11;
      const isInviteRoute = nextUrl.pathname.startsWith('/invite/');

      if (isAdminRoute) {
        if (!isLoggedIn) return Response.redirect(new URL(`/admin/login?callbackUrl=${encodeURIComponent(nextUrl.pathname)}`, nextUrl));
        if (userRole === 'USER') return Response.redirect(new URL('/challenge', nextUrl));
        if (userRole !== 'ADMIN') return Response.redirect(new URL('/check-in', nextUrl));
        return true;
      }
      
      if (isChallengeRoute || isInviteRoute) {
        if (!isLoggedIn) return Response.redirect(new URL(`/auth/login?callbackUrl=${encodeURIComponent(nextUrl.pathname)}`, nextUrl));
        return true;
      }
      
      if (isStaffRoute) {
        if (!isLoggedIn) return false;
        if (userRole === 'USER') return Response.redirect(new URL('/challenge', nextUrl));
        // Staff and Admin can access check-in
        return true;
      }
      
      if (isLoggedIn && (nextUrl.pathname === '/admin/login' || nextUrl.pathname === '/auth/login' || nextUrl.pathname === '/auth/register')) {
        if (userRole === 'ADMIN') return Response.redirect(new URL('/admin/dashboard', nextUrl));
        if (userRole === 'USER') return Response.redirect(new URL('/challenge', nextUrl));
        return Response.redirect(new URL('/check-in', nextUrl));
      }
      
      return true;
    },
    async jwt({ token, user }) {
        if (user) {
            token.role = user.role;
            token.id = user.id!;
        }
        return token;
    },
    async session({ session, token }) {
        if (token && session.user) {
            session.user.role = token.role as import("@prisma/client").Role;
            session.user.id = token.id as string;
        }
        return session;
    }
  },
  providers: [],
} satisfies NextAuthConfig;
