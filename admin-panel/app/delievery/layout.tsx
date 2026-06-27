"use client";

import { motion } from "motion/react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";

export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const logOut = () => {
    Cookies.remove("deliveryToken");
    router.push("/delievery");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">
                  Jewellry Wala - Delivery
                </h1>
              </div>
            </div>
            <div className="flex items-center">
              <Button
                onClick={() => logOut()}
                className="px-4 py-2 text-sm font-medium "
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8"
      >
        {children}
        <Toaster />
      </motion.main>
    </div>
  );
}
