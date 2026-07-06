"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api, ApiClientError } from "@/lib/api";
import { useAdminLogo } from "@/hooks/useAdminLogo";

export default function LoginPage() {
  const { logoUrl } = useAdminLogo();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/api/admin/user/login", { email, password });

      toast({
        title: "Login successful",
        description: "Welcome to the admin panel.",
      });

      router.push("/dashboard");
    } catch (error: unknown) {
      toast({
        title: "Login failed",
        description: error instanceof ApiClientError ? error.message : "Login failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ─── Left Side — Animated Illustration ─── */}
      <div className="relative flex-1 lg:flex-[1.2] min-h-[40vh] lg:min-h-screen overflow-hidden bg-white flex items-center justify-center">
        {/* Illustration */}
        <div className="relative z-10 w-full max-w-[95%] lg:max-w-[90%] h-full max-h-[70vh] lg:max-h-[85vh] animate-in fade-in duration-1000">
          <img
            src="/LoginAnimated.svg"
            alt="Login illustration"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Brand text */}
        <div className="absolute bottom-8 lg:bottom-12 left-0 right-0 text-center z-10 animate-in fade-in duration-1000 delay-500">
          <p className="text-slate-400 text-xs lg:text-sm tracking-[0.2em] uppercase font-light">
            Toy Shop — Admin Dashboard
          </p>
        </div>
      </div>

      {/* ─── Right Side — Login Form ─── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-gradient-to-br from-background via-background to-muted/50 relative">
        {/* Subtle background texture */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />

        <div className="w-full max-w-sm relative z-10">
          {/* Logo + Heading */}
          <div className="text-center mb-10">
            <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-5 overflow-hidden shadow-lg animate-in zoom-in duration-500">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-primary-foreground"
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
            <h1 className="text-2xl font-bold tracking-tight animate-in slide-in-from-top duration-500">
              Welcome Back
            </h1>
            <p className="text-muted-foreground mt-1.5 text-sm animate-in slide-in-from-top duration-500 delay-100">
              Sign in to your admin account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2 animate-in slide-in-from-left duration-500 delay-200">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-11 rounded-xl border-border/60 bg-background px-4 transition-all duration-200 focus:scale-[1.01] focus:border-primary/50 focus:shadow-[0_0_0_4px_rgba(100,100,255,0.08)]"
              />
            </div>

            <div className="space-y-2 animate-in slide-in-from-left duration-500 delay-300">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="h-11 rounded-xl border-border/60 bg-background px-4 transition-all duration-200 focus:scale-[1.01] focus:border-primary/50 focus:shadow-[0_0_0_4px_rgba(100,100,255,0.08)]"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-xl text-base font-medium animate-in slide-in-from-bottom duration-500 delay-400 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-primary/20"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2.5">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </span>
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground/60 mt-10 animate-in fade-in duration-500 delay-700">
            &copy; {new Date().getFullYear()} Toy Shop. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
