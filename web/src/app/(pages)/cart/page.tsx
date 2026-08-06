import Cart from "@/app/(sections)/Cart";
import CartSkeleton from "@/components/cart/CartSkeleton";
import React, { Suspense } from "react";
import { siteConfig } from "@/lib/utils";
import { cookies } from "next/headers";
import { serverFetch } from "@/lib/server-fetch";

export const metadata = {
  title: `Shopping Cart - ${siteConfig.name}`,
  description: "Review your selected jewellery pieces and proceed to checkout.",
  robots: {
    index: false,
    follow: true,
  },
};

async function getCart() {
  const cookie = await cookies();
  const token = cookie.get("userToken");

  if (!token) return null;

  try {
    const response = await serverFetch("/api/website/cart/view", {
      headers: { Authorization: `Bearer ${token.value}` },
      timeout: 5000,
    });
    const data = await response.json();
    if (!response.ok || !data._status) return null;
    return data;
  } catch {
    return null;
  }
}

async function CartContent() {
  const cart = await getCart();
  return <Cart cart={cart} />;
}

export default async function page() {
  return (
    <Suspense fallback={<CartSkeleton itemCount={3} />}>
      <CartContent />
    </Suspense>
  );
}
