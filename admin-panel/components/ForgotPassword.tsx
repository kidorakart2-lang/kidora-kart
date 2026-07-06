"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

const BACKEND_URL =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_BACKEND_URL) ||
  "http://localhost:5000/";

const LOGO_CACHE_KEY = "admin-login-logo";

export default function ForgotPassword() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fetchedRef = useRef(false);

  // Fetch logo on mount with sessionStorage caching
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const cached = sessionStorage.getItem(LOGO_CACHE_KEY);
    if (cached) {
      setLogoUrl(cached);
      return;
    }

    const base = BACKEND_URL.endsWith("/") ? BACKEND_URL : BACKEND_URL + "/";
    fetch(base + "api/website/logo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    })
      .then((res) => res.json())
      .then((json) => {
        if (json._status && Array.isArray(json._data) && json._data.length > 0) {
          const url = json._data[0].logo;
          if (url) {
            sessionStorage.setItem(LOGO_CACHE_KEY, url);
            setLogoUrl(url);
          }
        }
      })
      .catch(() => {
        // Silently fall back to the SVG icon
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/website/user/forgot-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Failed to send reset link. Please try again.");
      }

      const data = await response.json();
      if (data._status === true) {
        toast.success("If the email exists, a reset link has been sent.");
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to send reset link. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      <Card className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500 border-border/50 shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-20 h-20 rounded-xl flex items-center justify-center mb-4 animate-in zoom-in duration-300 delay-100 overflow-hidden">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full bg-primary rounded-xl flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-primary-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            )}
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">
            Forgot Password
          </CardTitle>
          <CardDescription className="text-base">
            Enter your email to receive a password reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full transition-all hover:scale-[1.02]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
