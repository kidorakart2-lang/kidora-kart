"use client";

import { useEffect, useState } from "react";
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Loader2, Mail } from "lucide-react";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const verifyToken = Cookies.get("verify");
  const [otp, setOtp] = useState("");
  const [isOtpComplete, setIsOtpComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (!email || !verifyToken) {
      router.push("/profile");
      return;
    }

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, email, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOtpComplete) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "api/website/user/complete-verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            otp,
            token: Cookies.get("verify"),
          }),
        }
      );

      if (!response.ok) {
       return toast.error("Verification failed. Please try again.");
      }

      const data = await response.json();
      if (data._status === true) {
        toast.success(data._message || "Your Email Will BE Verified Soon");
        router.push("/profile");
        Cookies.remove("verify");
      } else {
        toast.error(data._message || "Failed to verify email. Please try again.");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to verify email. Please try again.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;

    setIsResending(true);
    try {
      const token = getAuthToken();
      const response = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "api/website/user/verify-user",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email }),
        }
      );

      if (!response.ok) {
        return toast.error("Failed to resend OTP. Please try again.");
      }

      const data = await response.json();
      if (data._status === true) {
        Cookies.set("verify", data._token, {
          expires: new Date(Date.now() + 10 * 60 * 1000),
        });
        setCountdown(30);
        toast.success("Verification code resent successfully!");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to resend OTP. Please try again.";
      toast.error(msg);
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center  p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
            <Mail className="h-6 w-6 text-brand-600" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Verify Your Email
          </CardTitle>
          <CardDescription>
            We've sent a verification code to{" "}
            <span className="font-medium">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-muted-foreground"
              >
                Enter 6-digit code
              </label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(value) => {
                    setOtp(value);
                    setIsOtpComplete(value.length === 6);
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

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !isOtpComplete}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Email"
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Didn't receive a code?{" "}
              <button
                type="button"
                onClick={handleResendCode}
                disabled={countdown > 0 || isResending}
                className={`font-medium ${
                  countdown > 0 || isResending
                    ? "text-muted-foreground"
                    : "text-brand-600 hover:text-brand-700"
                }`}
              >
                {isResending
                  ? "Sending..."
                  : countdown > 0
                  ? `Resend in ${countdown}s`
                  : "Resend code"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
