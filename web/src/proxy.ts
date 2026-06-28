import { NextResponse, type NextRequest } from "next/server";

import { cookies } from "next/headers";

const protectedPaths = ["/profile", "/order-track"];
const authPaths = ["/login", "/signup"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieStore = await cookies();
  const token = cookieStore.get("userToken")?.value;

  // Redirect /category to /category/all
  if (pathname === "/category") {
    return NextResponse.redirect(
      new URL("/category/shop-by-category", request.url)
    );
  }

  // If user is not logged in and tries to access a protected route
  if (protectedPaths.some((p) => pathname.startsWith(p)) && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is logged in and tries to access auth routes
  if (authPaths.some((p) => pathname.startsWith(p)) && token) {
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  return NextResponse.next();
}
