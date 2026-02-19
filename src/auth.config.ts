import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const userRole = auth?.user?.role;
      
      const isAdminRoute = nextUrl.pathname.startsWith('/dashboard') || 
                           nextUrl.pathname.startsWith('/events') || 
                           nextUrl.pathname.startsWith('/registrations') ||
                           nextUrl.pathname.startsWith('/settings');
      const isStaffRoute = nextUrl.pathname.startsWith('/check-in');

      if (isAdminRoute) {
        if (!isLoggedIn) return false;
        if (userRole !== 'ADMIN') return Response.redirect(new URL('/check-in', nextUrl));
        return true;
      }
      
      if (isStaffRoute) {
        if (!isLoggedIn) return false;
        // Staff and Admin can access check-in
        return true;
      }
      
      if (isLoggedIn && nextUrl.pathname === '/login') {
        if (userRole === 'ADMIN') return Response.redirect(new URL('/dashboard', nextUrl));
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
