import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { securityHeaders, rateLimit } from '@/middleware/security';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apply security headers to all requests
  let response = securityHeaders(request);

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    const rateLimitResponse = rateLimit(request, 100, 15 * 60 * 1000); // 100 requests per 15 minutes
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Stricter rate limiting for auth endpoints
    if (pathname.startsWith('/api/auth/')) {
      const authRateLimitResponse = rateLimit(request, 10, 15 * 60 * 1000); // 10 requests per 15 minutes
      if (authRateLimitResponse) {
        return authRateLimitResponse;
      }
    }
  }

  // Only protect admin routes (except login page)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = request.cookies.get('admin-token')?.value;

    if (!token) {
      // Redirect to login with the current path as redirect parameter
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      // Verify the JWT token
      const { payload } = await jwtVerify(token, JWT_SECRET);
      
      // Check if user has admin role
      if (payload.role !== 'admin') {
        const loginUrl = new URL('/admin/login', request.url);
        loginUrl.searchParams.set('error', 'insufficient_permissions');
        return NextResponse.redirect(loginUrl);
      }

      // Token is valid, continue to the requested page
      return response || NextResponse.next();
    } catch (error) {
      console.error('JWT verification failed:', error);
      
      // Invalid token, redirect to login
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // For admin login page, redirect to dashboard if already authenticated
  if (pathname === '/admin/login') {
    const token = request.cookies.get('admin-token')?.value;
    
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        
        if (payload.role === 'admin') {
          // User is already authenticated, redirect to dashboard
          const redirectTo = request.nextUrl.searchParams.get('redirect') || '/admin/dashboard';
          return NextResponse.redirect(new URL(redirectTo, request.url));
        }
      } catch (error) {
        // Invalid token, let them access login page
        console.error('JWT verification failed on login page:', error);
      }
    }
  }

  // For all other routes, continue normally
  return response || NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all admin routes and API routes
     */
    '/admin',
    '/admin/:path*',
    '/api/:path*',
  ],
};