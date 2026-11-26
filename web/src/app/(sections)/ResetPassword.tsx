"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { getAuthToken } from "@/lib/cookies";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Lock, Mail } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import StrongPasswordInput from "@/components/comman/StrongPasswordInput";
import { useSelector } from "react-redux";
import Link from "next/link";
import Image from "next/image";
import BrandLogo from "@/components/comman/BrandLogo";
import type { RootState } from "@/redux/store/store";

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState("request");
  // If the logged-in session token is expired/invalid, the API can't read the
  // session email — fall back to asking for the email explicitly.
  const [showEmailFallback, setShowEmailFallback] = useState(false);

  const token = getAuthToken();
  const isLoggedIn = !!token;
  const returnTo = searchParams.get("returnTo");

  const handleRequestReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isLoggedIn && !email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      // When logged in, the API uses the session email — no need to send one.
      const response = await fetch(
        "/api/website/user/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(isLoggedIn && !showEmailFallback ? {} : { email }),
        }
      );

      if (!response.ok) {
        // Logged-in user with an expired/invalid session token — the API can't
        // resolve their email, so fall back to letting them type it.
        if (isLoggedIn && !showEmailFallback) {
          setShowEmailFallback(true);
          throw new Error(
            "Your session has expired. Please enter your email address to continue."
          );
        }
        throw new Error("Failed to send reset link. Please try again.");
      }

      const data = await response.json();
      if (data._status === true) {
        Cookies.set("otpToken", data._token, { expires: 1, secure: window.location.protocol === "https:" });
        setStep("otp");
        toast.success("Verification code sent to your email");
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send reset link. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(
        "/api/website/user/verify-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ otp, token: Cookies.get("otpToken") }),
        }
      );

      if (!response.ok) {
        try {
          const errorData = await response.json();
          toast.error(errorData._message || "Failed to verify OTP. Please try again.");
        } catch {
          toast.error("Failed to verify OTP. Please try again.");
        }
        return;
      }

      const data = await response.json();
      if (data._status === true) {
        setStep("reset");
        Cookies.remove("otpToken");
        Cookies.set("resetToken", data._token, { expires: 1, secure: window.location.protocol === "https:" });
        toast.success("OTP verified successfully");
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to verify OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const resetToken = Cookies.get("resetToken");
      if (!resetToken) {
        toast.error("Session expired. Please restart the password reset process.");
        return;
      }

      const response = await fetch(
        "/api/website/user/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: resetToken,
            newPassword,
          }),
        }
      );

      if (!response.ok) {
        try {
          const errorData = await response.json();
          toast.error(
            errorData._message || "Failed to reset password. Please try again."
          );
        } catch {
          toast.error("Failed to reset password. Please try again.");
        }
        return;
      }

      const data = await response.json();
      if (data._status === true) {
        toast.success("Password reset successfully!");
        Cookies.remove("resetToken");
        router.push(returnTo || "/login");
      } else {
        toast.error(data._message || "Something Went Wrong");
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to reset password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const logo = useSelector((state: RootState) => state.logo.logo);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-12">
      <Card className="w-full max-w-md rounded-xl border border-[var(--brand-gold)]/25 bg-white shadow-none">
        <div className="flex justify-center mt-7">
          <Link href="/">
            {logo ? (
              <Image
                src={logo}
                alt="Logo"
                width={180}
                height={60}
                className="h-12 w-auto object-contain"
              />
            ) : (
              <BrandLogo size="md" />
            )}
          </Link>
        </div>
        <CardHeader className="space-y-2 pb-2 pt-4 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-[var(--brand-gold)]/40 bg-[var(--brand-gold)]/10">
            <Lock className="h-5 w-5 text-[var(--brand-gold-dark)]" strokeWidth={1.6} />
          </div>
           <CardTitle className="display-heading pt-2 text-2xl">
            {step === "request"
              ? "Reset Password"
              : step === "otp"
                ? "Verify Code"
                : "Create New Password"}
          </CardTitle>
          <CardDescription className="text-[12px] text-[var(--brand-ink)]/65">
            {step === "request"
              ? "Enter your email to receive a password reset link"
              : step === "otp"
                ? "Enter the verification code sent to your email"
                : "Create a strong new password for your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "request" ? (
            <form onSubmit={handleRequestReset} className="space-y-5">
              {isLoggedIn && !showEmailFallback ? (
                <p className="text-center text-[12px] text-[var(--brand-ink)]/65">
                  You're signed in — a verification code will be sent to your
                  registered email address.
                </p>
              ) : (
                <div>
                  <Label htmlFor="email" className="mb-2 block text-[10.5px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/65">
                    Email Address
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail size={16} className="z-10 text-[var(--brand-gold-dark)]" strokeWidth={1.6} />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@mail.com"
                      className="w-full rounded-lg border border-[var(--brand-gold)]/30 bg-white py-3 pl-10 pr-4 text-[var(--brand-ink)] transition-all duration-300 focus:border-[var(--brand-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)]/30"
                      required
                    />
                  </div>
                </div>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full rounded-full py-3.5 text-[11px] uppercase tracking-[0.18em] transition-all duration-300 ${
                  isLoading
                    ? "cursor-not-allowed bg-[var(--brand-plum)]/45 text-[var(--brand-cream)]"
                    : "btn-gold"
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin h-5 w-5" />
                    Sending...
                  </span>
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </form>
          ) : step === "otp" ? (
            <form onSubmit={verifyOtp} className="space-y-5">
              <div className="space-y-2">
                <Label className="mb-2 block text-center text-[10.5px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/65">
                  Enter verification code
                </Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                  >
                    <InputOTPGroup className="gap-2 flex">
                      {Array.from({ length: 6 }, (_, i) => (
                        <InputOTPSlot
                          key={i}
                          index={i}
                          className="size-12 rounded-lg border-[var(--brand-gold)]/30 text-lg text-[var(--brand-ink)] focus-visible:ring-2 focus-visible:ring-[var(--brand-gold)]/40"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
               <button
                type="submit"
                disabled={isLoading}
                className={`w-full rounded-full py-3.5 text-[11px] uppercase tracking-[0.18em] transition-all duration-300 ${
                  isLoading
                    ? "cursor-not-allowed bg-[var(--brand-plum)]/45 text-[var(--brand-cream)]"
                    : "btn-gold"
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin h-5 w-5" />
                    Verifying...
                  </span>
                ) : (
                  "Verify Code"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <StrongPasswordInput
                id="newPassword"
                value={newPassword}
                onChange={setNewPassword}
              />
              <div>
                <Label htmlFor="confirmPassword" className="mb-2 block text-[10.5px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/65">
                  Confirm Password
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={16} className="z-10 text-[var(--brand-gold-dark)]" strokeWidth={1.6} />
                  </div>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full rounded-lg border border-[var(--brand-gold)]/30 bg-white py-3 pl-10 pr-4 text-[var(--brand-ink)] transition-all duration-300 focus:border-[var(--brand-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)]/30"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full rounded-full py-3.5 text-[11px] uppercase tracking-[0.18em] transition-all duration-300 ${
                  isLoading
                    ? "cursor-not-allowed bg-[var(--brand-plum)]/45 text-[var(--brand-cream)]"
                    : "btn-gold"
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin h-5 w-5" />
                    Updating...
                  </span>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
          )}

          {step !== "request" && (
            <p className="mt-6 text-center text-[11.5px] text-[var(--brand-ink)]/65">
              <button
                type="button"
                onClick={() => {
                  setStep("request");
                  setOtp("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setShowEmailFallback(false);
                }}
                className="text-[var(--brand-plum)] underline decoration-[var(--brand-gold)]/60 underline-offset-4 transition-colors hover:no-underline"
              >
                Back to reset password
              </button>
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
