import React from "react";
import Login from "@/app/(sections)/Login";
import { siteConfig } from "@/lib/utils";

export const metadata = {
  title: `Login - ${siteConfig.name}`,
  description: `Login to ${siteConfig.name} to access your account, track orders, and manage your wishlist.`,
  robots: {
    index: false,
    follow: true,
  },
};

export default function page() {
  return (
    <div>
      <Login />
    </div>
  );
}
