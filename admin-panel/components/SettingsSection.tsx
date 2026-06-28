"use client";

import {
  ArrowRight,
  CheckCircle,
  Lock,
  Mail,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { InputPassword } from "@/components/ui/input-password";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

interface SettingsData {
  email?: string;
  isEmailVerified?: boolean;
}

// Password Change Options Dialog
function PasswordOptionsDialog({
  open,
  onOpenChange,
  onOptionSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOptionSelect: (option: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Choose how you want to change your password.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button
            variant="outline"
            className="justify-start gap-2"
            onClick={() => onOptionSelect("change")}
          >
            <Lock className="h-4 w-4" />
            <span>Change Password</span>
          </Button>
          <Link href="/dashboard/reset-password">
            <Button
              variant="outline"
              className="justify-start gap-2 text-amber-600 hover:text-amber-700"
              onClick={() => onOptionSelect("forgot")}
            >
              <Lock className="h-4 w-4" />
              <span>I forgot my password</span>
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Password Change Form Sheet
function PasswordFormSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(
        "/api/website/user/change-password",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            oldPassword: currentPassword,
            newPassword,
          }),
        },
      );

      const resData = await response.json();

      if (!response.ok || !resData._status) {
        toast({
          title: "Error",
          description:
            resData._message || "Something went wrong. Please try again.",
        });
      }
      if (resData._status === true) {
        toast({
          title: "Success",
          description: "Password changed successfully.",
        });
        onOpenChange(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
      setIsLoading(false);
    } catch (error: unknown) {
      console.error(error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      });
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-white px-6 py-8 rounded-l-2xl shadow-2xl animate-in slide-in-from-right duration-300 ease-out">
        <SheetHeader className="text-center mb-6">
          <SheetTitle className="text-2xl font-semibold text-[#5d4037]">
            Change Password
          </SheetTitle>
          <SheetDescription className="text-[#795548]/80">
            Enter your current password and a new password.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 animate-in fade-in duration-500"
        >
          <div className="space-y-1">
            <InputPassword
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              label="Current Password"
              className="focus:ring-2 focus:ring-[#d7ccc8] rounded-lg transition-all duration-200"
            />
          </div>

          <div className="space-y-1">
            <InputPassword
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              label="New Password"
              className="focus:ring-2 focus:ring-[#d7ccc8] rounded-lg transition-all duration-200"
            />
          </div>

          <div className="space-y-1">
            <InputPassword
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              label="Confirm New Password"
              className="focus:ring-2 focus:ring-[#d7ccc8] rounded-lg transition-all duration-200"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 bg-gradient-to-r from-[#d7b377] via-[#b98b5d] to-[#8d6e63] text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300 disabled:opacity-60"
          >
            {isLoading ? "Processing..." : "Update Password"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export default function SettingsSection({ data }: { data?: SettingsData }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPasswordOptions, setShowPasswordOptions] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Handle verify email/phone
  const handleVerifyClick = async (type: string) => {
    if (type === "email") {
      try {
        setLoading(true);
        const response = await fetch(
          "/api/website/user/verify-user",
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: data?.email,
            }),
          },
        );

        const resData = await response.json();
        if (!response.ok || !resData._status) {
          toast({
            title: "Error",
            description:
              resData._message || "Something went wrong. Please try again.",
          });
        }
        if (resData._status === true) {
          Cookies.set("verify", resData._token, {
            expires: new Date(Date.now() + 10 * 60 * 1000),
          });
          router.push(`/dashboard/verify-email?email=${data?.email}`);
        }
      } catch (error: unknown) {
        console.error(error);
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Something went wrong. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {loading && (
        <div className="fixed top-0 left-0 right-0 bottom-0 w-full h-full flex items-center justify-center">
          <Loader2 className="animate-spin" />
        </div>
      )}
      {/* Security Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Security</h3>

        {/* Change Password Button */}
        <button
          onClick={() => setShowPasswordOptions(true)}
          className="w-full flex items-center justify-between p-4 bg-white/80 rounded-lg border border-gray-200 hover:border-amber-300 hover:shadow-md transition-all duration-300 group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors duration-300">
              <Lock size={18} className="text-amber-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-800">Change Password</p>
              <p className="text-sm text-gray-500">
                Update your password regularly
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-amber-600 transition-colors" />
        </button>

        {/* Verify Email Button */}
        {data?.isEmailVerified ? null : (
          <button
            onClick={() => handleVerifyClick("email")}
            className="w-full flex items-center justify-between p-4 bg-white/80 rounded-lg border border-gray-200 hover:border-amber-300 hover:shadow-md transition-all duration-300 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-300">
                <Mail size={18} className="text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-800 flex items-center gap-2">
                  Verify Email
                  {!data?.isEmailVerified && (
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                      Pending
                    </span>
                  )}
                  {data?.isEmailVerified && (
                    <CheckCircle size={16} className="text-green-600" />
                  )}
                </p>
                <p className="text-sm text-gray-500">
                  {data?.isEmailVerified
                    ? "Your email is verified"
                    : "Verify your email address"}
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-amber-600 transition-colors" />
          </button>
        )}

        <PasswordOptionsDialog
          open={showPasswordOptions}
          onOpenChange={setShowPasswordOptions}
          onOptionSelect={(option) => {
            if (option === "change") {
              setShowPasswordOptions(false);
              setShowPasswordForm(true);
            } else {
              router.push("/dashboard/reset-password");
            }
          }}
        />
        <PasswordFormSheet
          open={showPasswordForm}
          onOpenChange={setShowPasswordForm}
        />
      </div>
    </div>
  );
}
