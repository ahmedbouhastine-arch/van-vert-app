
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard', '/admin', '/applications', '/profile', '/settings'];
const publicRoutes = ['/login', '/register', '/forgot-password'];

export function middleware(request: NextRequest) {
    const sessionCookie = request.cookies.get('session');
    const requestedUrl = request.nextUrl.pathname;

    const isProtectedRoute = protectedRoutes.some(route => requestedUrl.startsWith(route));
    const isPublicRoute = publicRoutes.includes(requestedUrl);

    // If user has a session cookie and tries to access a public auth page, redirect them to the dashboard.
    if (sessionCookie && isPublicRoute) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // If user does not have a session cookie and tries to access a protected route, redirect them to login.
    // This check is only for GET requests to avoid interfering with API-like server action POSTs.
    if (!sessionCookie && isProtectedRoute && request.method === 'GET') {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Allow the request to proceed.
    return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  /*
   * Match all request paths except for the ones starting with:
   * - api (API routes)
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   * - any file extension for common image formats
   */
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
