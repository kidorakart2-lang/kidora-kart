"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { getAuthToken } from "@/lib/getAuthToken";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Lock } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState("request");

  const token = getAuthToken();
  const returnTo = searchParams.get("returnTo");

  const handleRequestReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const emailInput = (e.target as HTMLFormElement).email.value;
    if (!emailInput) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "api/website/user/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email: emailInput }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send reset link. Please try again.");
      }

      const data = await response.json();
      if (data._status === true) {
        Cookies.set("otpToken", data._token, { expires: 1 });
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
        process.env.NEXT_PUBLIC_API_URL + "api/website/user/verify-otp",
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
        } catch (e) {
          // Fallback in case response isn't JSON
          toast.error("Failed to verify OTP. Please try again.");
        }
        return;
      }

      const data = await response.json();
      if (data._status === true) {
        setStep("reset");
        Cookies.remove("otpToken");
        Cookies.set("resetToken", data._token, { expires: 1 });
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
        process.env.NEXT_PUBLIC_API_URL + "api/website/user/reset-password",
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
        } catch (e) {
          toast.error("Failed to reset password. Please try again.");
        }
        return;
      }

      const data = await response.json();
      if (data._status === true) {
        toast.success("Password reset successfully! ");
        Cookies.remove("resetToken");
        router.push(returnTo || "/");
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

  return (
    <div className="flex min-h-screen items-center justify-center  p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
            <Lock className="h-6 w-6 text-brand-600" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {step === "request" ? "Reset Password" : "Create New Password"}
          </CardTitle>
          <CardDescription>
            {step === "request"
              ? "Enter your email to receive a password reset link"
              : "Create a new password for your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "request" ? (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-muted-foreground"
                >
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="w-full"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
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
          ) : step === "otp" ? (
            <form onSubmit={verifyOtp} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-muted-foreground">
                  Enter verification code
                </label>
                <div className="flex justify-center space-x-2">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(value) => {
                      setOtp(value);
                    }}
                  >
                    <InputOTPGroup className="gap-2 flex">
                      {[...Array(6)].map((_, index) => (
                        <InputOTPSlot
                          key={index}
                          index={index}
                          className="h-12 w-12 text-lg border-border focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
              <Button type="submit" className="w-full">
                Verify Code
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-muted-foreground"
                >
                  New Password
                </label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full"
                  required
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-muted-foreground"
                >
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
