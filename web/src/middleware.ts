import { NextResponse } from 'next/server';
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const path = req.nextUrl.pathname;
  
  const session = (req as any).auth;
  const role = session?.user?.role;
  const businessId = session?.user?.businessId;
  
  console.log(`DEBUG: Middleware - Path: ${path}, Session exists: ${!!session}, Role: ${role}`);

  // 1. If no session, redirect to login
  if (!session) {
    console.log("DEBUG: Middleware - Redirecting to /login due to no session");
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 2. SuperAdmin Bypass
  if (role === 'SUPERADMIN') {
    return NextResponse.next();
  }

  // 3. Protect SuperAdmin routes for non-SuperAdmins
  if (path.startsWith('/super-admin') && role !== 'SUPERADMIN') {
    console.log("DEBUG: Blocking non-SuperAdmin from super-admin route");
    return NextResponse.redirect(new URL('/access-denied', req.url));
  }

  // 4. Enforce Business Context for non-SuperAdmins
  if (!businessId) {
    return NextResponse.redirect(new URL('/setup-organization', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/super-admin/:path*",
  ],
};
