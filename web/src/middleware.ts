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

  // 0. Explicitly allow Auth API routes and static PWA assets
  if (path.startsWith('/api/auth') || path === '/manifest.json' || path === '/sw.js') {
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
    console.log("DEBUG: Middleware - Session present, checking if redirect is needed");
    
    // If they are on /register and don't have a businessId, let them stay to complete registration
    if (path.startsWith('/register') && !businessId && role !== 'SUPERADMIN') {
      return NextResponse.next();
    }

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
  if (path.startsWith('/super-admin') && role !== 'SUPERADMIN') {
    console.log("DEBUG: Blocking non-SuperAdmin from super-admin route");
    return NextResponse.redirect(new URL('/access-denied', req.url));
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
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (pwa manifest)
     * - sw.js (service worker)
     * - images/ (public images)
     * - .*\.(?:svg|png|jpg|jpeg|gif|webp|css|js)$ (all common static assets)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.json|sw.js|images/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)$).*)',
  ],
};
