"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api, ApiClientError, refreshCsrfToken } from "@/lib/api";
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

      // Re-fetch CSRF token after successful login so subsequent mutation
      // requests have a fresh CSRF cookie. This resets the module-level cache,
      // so even if the initial fetch failed at page load (network glitch) the
      // admin is not stuck with every mutation returning 403.
      await refreshCsrfToken();

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
      <div className="relative flex-1 lg:flex-[1.2] min-h-[40vh] lg:min-h-screen overflow-hidden bg-[radial-gradient(120%_90%_at_20%_0%,rgba(198,168,117,0.14),transparent_60%),radial-gradient(100%_80%_at_100%_100%,rgba(185,149,165,0.12),transparent_60%)] flex items-center justify-center">
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
          <p className="text-[10px] lg:text-xs uppercase tracking-[0.32em] text-[#a97f3f]/80">
            Ratnavya — Admin Suite
          </p>
        </div>
      </div>

      {/* ─── Right Side — Login Form ─── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-gradient-to-br from-background via-background to-muted/50 relative">
        {/* Subtle background texture */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />

        <div className="w-full max-w-sm relative z-10">
          {/* Logo + Heading */}
          <div className="text-center mb-10">
            <div className="mx-auto mb-5 flex h-16 w-[210px] items-center justify-center animate-in zoom-in duration-500">
              <img
                src={logoUrl || "/Ratnavya Gold Leaf Logo.webp"}
                alt="Ratnavya logo"
                className="h-14 w-auto max-w-full object-contain drop-shadow-[0_10px_24px_rgba(198,168,117,0.25)]"
              />
            </div>
            <p className="admin-eyebrow mb-2 animate-in fade-in duration-500">
              ✦ Admin Access
            </p>
            <h1 className="admin-display text-3xl tracking-tight animate-in slide-in-from-top duration-500">
              Welcome back
            </h1>
            <p className="text-muted-foreground mt-2 text-sm animate-in slide-in-from-top duration-500 delay-100">
              Sign in to manage your store
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
                className="h-11 rounded-xl border-border/60 bg-background px-4 transition-all duration-200 focus:scale-[1.01] focus:border-[#c6a875]/60 focus:shadow-[0_0_0_4px_rgba(198,168,117,0.14)]"
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
                className="h-11 rounded-xl border-border/60 bg-background px-4 transition-all duration-200 focus:scale-[1.01] focus:border-[#c6a875]/60 focus:shadow-[0_0_0_4px_rgba(198,168,117,0.14)]"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-xl text-base font-medium tracking-wide animate-in slide-in-from-bottom duration-500 delay-400 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-primary/20"
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
            &copy; {new Date().getFullYear()} Ratnavya. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
