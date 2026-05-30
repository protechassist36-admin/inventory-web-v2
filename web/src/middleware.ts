import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  // 0. Explicitly allow Auth API routes
  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
  const path = request.nextUrl.pathname;

  // 1. If no token, redirect to login unless already there
  if (!token) {
    if (path.startsWith('/login') || path.startsWith('/register') || path === '/') {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. If token is present, don't let them go back to login/register/root
  if (path.startsWith('/login') || path.startsWith('/register') || path === '/') {
    if (token.role === 'SUPERADMIN') {
      return NextResponse.redirect(new URL('/super-admin', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 3. SuperAdmin Bypass
  if (token.role === 'SUPERADMIN') {
    return NextResponse.next();
  }

  // 4. Protect SuperAdmin routes for non-SuperAdmins
  if (path.startsWith('/super-admin')) {
    console.log("DEBUG: Blocking non-SuperAdmin from super-admin route");
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 5. Enforce Business Context for non-SuperAdmins
  if (!token.businessId) {
    return NextResponse.redirect(new URL('/register', request.url));
  }

  // If already logged in and hitting a dashboard route as a standard user, 
  // allow them if they have a businessId
  if (path.startsWith('/dashboard') || path === '/') {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-business-id', token.businessId as string);
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/super-admin/:path*', '/api/:path*', '/login', '/register', '/'],
};
