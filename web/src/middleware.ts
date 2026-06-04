import { NextResponse } from 'next/server';
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const session = (req as any).auth;
  const path = req.nextUrl.pathname;
  const role = session?.user?.role;
  const businessId = session?.user?.businessId;
  
  console.log(`DEBUG: Middleware - Path: ${path}, Session exists: ${!!session}, Role: ${role}`);

  // 0. Explicitly allow Auth API routes
  if (path.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // 1. If no session, redirect to login unless already there
  if (!session) {
    if (path.startsWith('/login') || path.startsWith('/register') || path === '/') {
      return NextResponse.next();
    }
    console.log("DEBUG: Middleware - Redirecting to /login due to no session");
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 2. If session is present, don't let them go back to login/register/root
  if (path.startsWith('/login') || path.startsWith('/register') || path === '/') {
    console.log("DEBUG: Middleware - Session present, redirecting based on role:", role);
    if (role === 'SUPERADMIN') {
      return NextResponse.redirect(new URL('/super-admin', req.url));
    }
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // 3. SuperAdmin Bypass
  if (role === 'SUPERADMIN') {
    return NextResponse.next();
  }

  // 4. Protect SuperAdmin routes for non-SuperAdmins
  if (path.startsWith('/super-admin')) {
    console.log("DEBUG: Blocking non-SuperAdmin from super-admin route");
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // 4b. Enforce Trial Expiration
  const trialEndDate = session?.user?.trialEndDate;
  if (trialEndDate && new Date(trialEndDate) < new Date() && !path.startsWith('/pricing')) {
     console.log("DEBUG: Trial expired, redirecting to pricing");
     return NextResponse.redirect(new URL('/pricing', req.url));
  }

  // 5. Enforce Business Context for non-SuperAdmins
  if (!businessId) {
    return NextResponse.redirect(new URL('/register', req.url));
  }

  // 6. Allow dashboard routes and inject businessId
  if (path.startsWith('/dashboard') || path === '/') {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-business-id', businessId as string);
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: ['/dashboard/:path*', '/super-admin/:path*', '/api/:path*', '/login', '/register', '/'],
};
