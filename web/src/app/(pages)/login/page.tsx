import React from "react";
import Login from "@/app/(sections)/Login";
import { siteConfig } from "@/lib/utils";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata = {
  title: `Login - ${siteConfig.name}`,
  description: `Login to ${siteConfig.name} to access your account, track orders, and manage your wishlist.`,
  robots: {
    index: false,
    follow: true,
  },
};

export default async function page() {
  const cookieStore = await cookies();
  const token = cookieStore.get("userToken");
  if (token) {
    redirect("/");
  }

  return (
    <div>
      <Login />
    </div>
  );
}
