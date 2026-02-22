
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard', '/admin', '/applications'];

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
    // We will get the session cookie from the browser
    const sessionCookie = request.cookies.get('__session');
    const requestedUrl = request.nextUrl.pathname;

    const isProtectedRoute = protectedRoutes.some(route => requestedUrl.startsWith(route));

    // Only apply auth redirection for page loads (GET requests) to avoid
    // interfering with server action POST requests, which handle their own auth.
    if (request.method === 'GET' && isProtectedRoute && !sessionCookie) {
        const absoluteLoginUrl = new URL('/login', request.url);
        return NextResponse.redirect(absoluteLoginUrl);
    }

    // If the user has a session or is accessing a public route, allow the request to proceed.
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
