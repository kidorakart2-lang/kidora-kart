import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "");

async function verifyToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isPublicPath = path === "/" || path === "/login";
  const isDeliveryPath = path.startsWith("/delievery");

  const adminToken = request.cookies.get("adminToken")?.value;
  const deliveryToken = request.cookies.get("deliveryToken")?.value;

  const adminValid = adminToken ? await verifyToken(adminToken) : false;
  const deliveryValid = deliveryToken ? await verifyToken(deliveryToken) : false;

  if (!isDeliveryPath) {
    if (isPublicPath && adminValid) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (!isPublicPath && !adminValid) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (isDeliveryPath) {
    if (!deliveryValid && path !== "/delievery") {
      return NextResponse.redirect(new URL("/delievery", request.url));
    }

    if (deliveryValid && path === "/delievery") {
      return NextResponse.redirect(new URL("/delievery/orders", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/login",
    "/delievery",
    "/delievery/orders/:path*",
  ],
};
