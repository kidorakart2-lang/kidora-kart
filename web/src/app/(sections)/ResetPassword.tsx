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
    <main className="min-h-screen flex items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <div className="flex justify-center mt-6">
          <Link href="/">
            <Image
              src={logo || "/images/logo.webp"}
              alt="Logo"
              width={120}
              height={50}
              className="h-12 w-auto object-contain"
            />
          </Link>
        </div>
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
            <Lock className="h-6 w-6 text-brand-600" />
          </div>
           <CardTitle className="text-2xl fw-heading">
            {step === "request"
              ? "Reset Password"
              : step === "otp"
                ? "Verify Code"
                : "Create New Password"}
          </CardTitle>
          <CardDescription>
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
                <p className="text-sm text-muted-foreground text-center">
                  You're signed in — a verification code will be sent to your
                  registered email address.
                </p>
              ) : (
                <div>
                  <Label htmlFor="email" className="block text-muted-foreground mb-2 font-medium text-sm">
                    Email Address
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail size={18} className="text-foreground z-10" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@mail.com"
                      className="w-full pl-10 pr-4 py-3 bg-background/70 backdrop-blur-sm border border-border rounded-xl focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md"
                      required
                    />
                  </div>
                </div>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 text-background font-semibold rounded-xl transition-all duration-300 shadow-sm transform hover:-translate-y-0.5 ${
                  isLoading
                    ? "bg-brand-400 cursor-not-allowed opacity-70"
                    : "btn-gradient"
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
                <Label className="block text-muted-foreground mb-2 font-medium text-sm text-center">
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
                          className="h-12 w-12 text-lg border-border focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
               <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 text-background fw-cta rounded-xl transition-all duration-300 shadow-sm transform hover:-translate-y-0.5 ${
                  isLoading
                    ? "bg-brand-400 cursor-not-allowed opacity-70"
                    : "btn-gradient"
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
                <Label htmlFor="confirmPassword" className="block text-muted-foreground mb-2 font-medium text-sm">
                  Confirm Password
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-foreground z-10" />
                  </div>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pl-10 pr-4 py-3 bg-background/70 backdrop-blur-sm border border-border rounded-xl focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 text-background font-semibold rounded-xl transition-all duration-300 shadow-sm transform hover:-translate-y-0.5 ${
                  isLoading
                    ? "bg-brand-400 cursor-not-allowed opacity-70"
                    : "btn-gradient"
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
            <p className="text-center text-muted-foreground text-sm mt-6">
              <button
                type="button"
                onClick={() => {
                  setStep("request");
                  setOtp("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setShowEmailFallback(false);
                }}
                className="text-brand-600 hover:text-brand-700 font-semibold hover:underline transition-colors"
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
