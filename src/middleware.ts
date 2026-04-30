import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";
import { canAccess, ROLE_HOME } from "@/lib/permissions";
import type { UserRole } from "@/types";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const pathname = nextUrl.pathname;

  if (pathname.startsWith("/api/auth")) return NextResponse.next();

  if (pathname === "/login") {
    if (session?.user) {
      const home = ROLE_HOME[session.user.role as UserRole] ?? "/login";
      return NextResponse.redirect(new URL(home, req.url));
    }
    return NextResponse.next();
  }

  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = session.user.role as UserRole;

  if (pathname.startsWith("/api/")) return NextResponse.next();

  if (!canAccess(role, pathname)) {
    const home = ROLE_HOME[role] ?? "/login";
    return NextResponse.redirect(new URL(home, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
