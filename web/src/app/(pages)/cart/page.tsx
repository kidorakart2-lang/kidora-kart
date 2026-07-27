import Cart from "@/app/(sections)/Cart";
import React from "react";
import { siteConfig } from "@/lib/utils";
import { cookies } from "next/headers";

export const metadata = {
  title: `Shopping Cart - ${siteConfig.name}`,
  description: "Review your selected toys and games and proceed to checkout.",
  robots: {
    index: false,
    follow: true,
  },
};

async function getCart() {
  const cookie = await cookies();
  const token = cookie.get("userToken");

  if (!token) return null;

  const response = await fetch("/api/website/cart/view", {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    }
  );

  const data = await response.json();
  if (!response.ok || !data._status) {
    return null;
  }
  return data;
}

export default async function page() {
  const cart = await getCart();
  return <Cart cart={cart} />;
}
