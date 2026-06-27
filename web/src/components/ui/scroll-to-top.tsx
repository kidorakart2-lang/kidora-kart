"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility);
    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, []);

  return (
    <div className="fixed bottom-8 right-7   z-50">
      <Button
        type="button"
        onClick={scrollToTop}
        className={cn(
          "bg-white backdrop-blur-sm rounded-full p-2 shadow-lg transition-all duration-300 ease-in-out",
          "hover:bg-white hover:scale-115 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2",
          "dark:bg-gray-800/80 dark:hover:bg-gray-800",
          isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        )}
        aria-label="Scroll to top"
      >
        <ChevronUp className="h-5 w-5 text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300" />
      </Button>
    </div>
  );
}
