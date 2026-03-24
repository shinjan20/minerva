import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/auth";

const publicPrefixes = ["/login", "/register", "/forgot-password", "/reset-password"];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  const isPublicRoute = path === "/" || publicPrefixes.some((route) => path.startsWith(route));
  
  // TEMPORARY: Bypass auth for local audit
  if (request.nextUrl.hostname === 'localhost' || request.nextUrl.hostname === '127.0.0.1') {
    return NextResponse.next();
  }
  
  // Exclude API routes, static files, and images from middleware redirect
  if (path.startsWith("/api") || path.startsWith("/_next") || path.includes(".")) {
    return NextResponse.next();
  }

  const session = request.cookies.get("session")?.value;
  let user = null;

  if (session) {
    try {
      user = await decrypt(session);
      console.log("Middleware: Session decrypted for user", user.email, user.role);
    } catch (e) {
      console.error("Middleware: Session decryption failed", e);
    }
  }

  if (!user && !isPublicRoute) {
    console.log("Middleware: No user, redirecting to login from", path);
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  if (user && isPublicRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
  }

  // Role based access control for frontend routes
  if (user) {
    if (path.startsWith("/admin") && user.role !== "OFFICE_STAFF") {
      return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
    }
    if (path.startsWith("/students") && user.role !== "OFFICE_STAFF") {
      return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
