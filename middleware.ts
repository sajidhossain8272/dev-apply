import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";

const protectedMiddleware = withAuth({
  pages: {
    signIn: "/login",
  },
});

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  // Temporary personal-workspace bypass while GitHub OAuth is being repaired.
  // This intentionally applies to this page only; all APIs and other dashboard
  // routes remain protected by NextAuth.
  if (request.nextUrl.pathname === "/dashboard/sajid") {
    return NextResponse.next();
  }
  return protectedMiddleware(request as any, event);
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
