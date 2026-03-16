import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const publicPaths = ["/", "/login", "/register", "/kid-login", "/api/auth"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow TV dashboard (uses token-based auth)
  if (pathname.startsWith("/tv/")) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Role-based routing
  const role = req.auth.user?.role;

  if (pathname.startsWith("/parent") && role !== "PARENT") {
    return NextResponse.redirect(new URL("/kid", req.url));
  }

  if (pathname.startsWith("/kid") && role !== "CHILD") {
    return NextResponse.redirect(new URL("/parent", req.url));
  }

  return NextResponse.next();
});

export const runtime = "nodejs";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|avatars|icons).*)"],
};
