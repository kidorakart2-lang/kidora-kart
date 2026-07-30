"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getAuthToken } from "@/lib/cookies";
import { Button } from "@/components/ui/button";
import { InputPassword } from "@/components/ui/input-password";
import StrongPasswordInput from "@/components/comman/StrongPasswordInput";
import { Lock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store/store";
import Image from "next/image";

export default function ChangePasswordPage() {
  const router = useRouter();
  const logo = useSelector((state: RootState) => state.logo.logo);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        router.push("/login?returnTo=/change-password");
        return;
      }

      const response = await fetch("/api/website/user/change-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            oldPassword: currentPassword,
            newPassword,
          }),
        }
      );

      const resData = await response.json();

      if (resData._status === true) {
        toast.success("Password changed successfully");
        router.push("/profile?tab=settings");
      } else {
        toast.error(resData._message || "Failed to change password");
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err?.response?.data?.message || err?.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-[550px] flex justify-center bg-muted p-4 relative overflow-hidden">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
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

        <div className="bg-background rounded-xl p-6 shadow-sm border border-border">
          <Link
            href="/profile?tab=settings"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Settings
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-brand-100 rounded-lg">
              <Lock size={20} className="text-brand-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Change Password</h1>
              <p className="text-sm text-muted-foreground">
                Update your account password
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <InputPassword
              id="currentPassword"
              label="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
            />

            <StrongPasswordInput
              id="newPassword"
              value={newPassword}
              onChange={setNewPassword}
            />

            <InputPassword
              id="confirmPassword"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              required
            />

            <Button
              type="submit"
              disabled={isLoading}
              variant="gradient"
              className="w-full font-semibold py-3 rounded-xl shadow-sm transition-all duration-300 disabled:opacity-60"
            >
              {isLoading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
