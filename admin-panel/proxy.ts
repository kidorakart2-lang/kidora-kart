import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isPublicPath = path === "/" || path === "/login";
  const adminToken = request.cookies.get("adminToken")?.value;

  // Simple existence check — the API backend cryptographically verifies
  // every JWT on each request, so this is sufficient for middleware routing.
  const adminValid = !!adminToken;

  // Already logged in and visiting login page → redirect to dashboard
  if (isPublicPath && adminValid) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Not logged in and visiting a protected page → redirect to login
  if (!isPublicPath && !adminValid) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/login",

  ],
};
