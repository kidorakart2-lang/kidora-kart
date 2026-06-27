import Cart from "@/app/(sections)/Cart";
import React from "react";
import { siteConfig } from "@/lib/utils";
import { cookies } from "next/headers";

export const metadata = {
  title: `Shopping Cart - ${siteConfig.name}`,
  description: "Review your selected jewellery items and proceed to checkout.",
  robots: {
    index: false,
    follow: true,
  },
};

async function getCart() {
  const cookie = await cookies();
  const token = cookie.get("user");

  if (!token) return null;

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}api/website/cart/view`,
    {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
      method: "post",
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
