import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ArrowRight } from "lucide-react";
import { siteConfig } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {/*
       * Static HTML that works without JavaScript.
       * No framer-motion dependency — renders reliably on every browser.
       */}
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-indigo-600 mb-4">
            404
          </h1>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Oops! Page not found
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/" passHref>
            <Button className="gap-2" size="lg">
              <Home className="h-4 w-4" />
              Go to Homepage
            </Button>
          </Link>
          <Link href="/contact" passHref>
            <Button variant="outline" className="gap-2" size="lg">
              Contact Support
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="mt-16 text-gray-400 text-sm">
          <p>
            &copy; {new Date().getFullYear()} Jewellery Walla. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
