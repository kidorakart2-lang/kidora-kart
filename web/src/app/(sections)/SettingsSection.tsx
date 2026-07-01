"use client";

import { ArrowRight, CheckCircle, Lock, Mail, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { InputPassword } from "@/components/ui/input-password";
import { logout } from "@/redux/features/auth";
import { useDispatch } from "react-redux";
import Cookies from "js-cookie";
import { getAuthToken } from "@/lib/getAuthToken";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoadingUi } from "./Cart";

// Password Change Options Dialog
function PasswordOptionsDialog({ open, onOpenChange, onOptionSelect }: { open: boolean; onOpenChange: (open: boolean) => void; onOptionSelect: (option: string) => void }) {
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
          <Link href="/reset-password">
            <Button
              variant="outline"
              className="justify-start gap-2 text-brand-600 hover:text-brand-700"
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
function PasswordFormSheet({ open, onOpenChange, type = "change" }: { open: boolean; onOpenChange: (open: boolean) => void; type?: string }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    // Handle password change logic here
    try {
      const token = getAuthToken();
      const response = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "api/website/user/change-password",
        {
          method: "POST",
          credentials: "include",
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

      if (!response.ok) {
        throw new Error("Something went wrong. Please try again.");
      }

      const resData = await response.json();
      if (resData._status === true) {
        toast.success("Password changed successfully.");
        onOpenChange(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setIsLoading(false);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-background px-6 py-8 rounded-l-2xl shadow-2xl animate-in slide-in-from-right duration-300 ease-out">
        <SheetHeader className="text-center mb-6">
          <SheetTitle className="text-2xl font-semibold text-brand-800">
            {type === "change" ? "Change Password" : "Reset Password"}
          </SheetTitle>
          <SheetDescription className="text-brand-700/80">
            {type === "change"
              ? "Enter your current password and a new password."
              : "Enter your email to receive a password reset link."}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 animate-in fade-in duration-500"
        >
          {type === "change" && (
            <div className="space-y-1">
              <InputPassword
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                label="Current Password"
                className="focus:ring-2 focus:ring-brand-200 rounded-lg transition-all duration-200"
              />
            </div>
          )}

          <div className="space-y-1">
            <InputPassword
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              label="New Password"
              className=" focus:ring-2 focus:ring-brand-200 rounded-lg transition-all duration-200"
            />
          </div>

          <div className="space-y-1">
            <InputPassword
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              label="Confirm New Password"
              className=" focus:ring-2 focus:ring-brand-200 rounded-lg transition-all duration-200"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 bg-gradient-to-r from-brand-400 via-brand-500 to-brand-700 text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300 disabled:opacity-60"
          >
            {isLoading ? "Processing..." : "Update Password"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

import type { UserDetails } from "@/types";

export default function SettingsSection({ data }: { data: UserDetails }) {
  const router = useRouter();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showPasswordOptions, setShowPasswordOptions] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [loading , setLoading] = useState(false)
  const dispatch = useDispatch();

  // Handle verify email/phone
  const handleVerifyClick = async (type: string) => {
    if (type === "email") {
      setLoading(true)
      try {
        const token = getAuthToken();
        const response = await fetch(
          process.env.NEXT_PUBLIC_API_URL + "api/website/user/verify-user",
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              email: data.email,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Something went wrong. Please try again.");
        }

        const resData = await response.json();
        if (!resData._status) {
          return toast.error(resData._message);
        }
        if (resData._status) {
          Cookies.set("verify", resData._token, {
            expires: new Date(Date.now() + 10 * 60 * 1000),
          });
          router.push(`/verify-email?email=${data.email}`);
          setLoading(false)
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      }finally{
        setLoading(false)
      }
    } else if (type === "phone") {
      // Handle phone verification
      // Similar to email verification but for phone
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch(process.env.NEXT_PUBLIC_API_URL + "api/website/user/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Silently handle - cookie will be stale but harmless
    }
    Cookies.remove("userToken", { path: "/" });
    dispatch(logout());
    router.push("/");
  };



  return (
    <div className="space-y-6">
      <LoadingUi hidden={loading} />
      {/* Security Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Security</h3>

        {/* Change Password Button */}
        <button
          onClick={() => setShowPasswordOptions(true)}
          className="w-full flex items-center justify-between p-4 bg-background/80 rounded-lg border border-border hover:border-brand-300 hover:shadow-md transition-all duration-300 group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-100 rounded-lg group-hover:bg-brand-200 transition-colors duration-300">
              <Lock size={18} className="text-brand-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-foreground">Change Password</p>
              <p className="text-sm text-muted-foreground">
                Update your password regularly
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-brand-600 transition-colors" />
        </button>

        {/* Verify Email Button */}
        {data?.isEmailVerified ? null : (
          <button
            onClick={() => handleVerifyClick("email")}
            className="w-full flex items-center justify-between p-4 bg-background/80 rounded-lg border border-border hover:border-brand-300 hover:shadow-md transition-all duration-300 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-100 rounded-lg group-hover:bg-brand-200 transition-colors duration-300">
                <Mail size={18} className="text-brand-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground flex items-center gap-2">
                  Verify Email
                  {!data?.isEmailVerified && (
                    <span className="px-2 py-0.5 bg-brand-100 text-brand-700 text-xs rounded-full">
                      Pending
                    </span>
                  )}
                  {data?.isEmailVerified && (
                    <CheckCircle size={16} className="text-green-600" />
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {data?.isEmailVerified
                    ? "Your email is verified"
                    : "Verify your email address"}
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-brand-600 transition-colors" />
          </button>
        )}

        {/* Logout Button */}
        <div className="pt-4 border-t border-border">
          <Button
            onClick={() => setShowLogoutDialog(true)}
            className="flex items-center gap-2 text-destructive hover:text-destructive/80 font-medium transition-colors duration-300 bg-background border-destructive hover:bg-destructive/20"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </Button>
        </div>
        <PasswordOptionsDialog
          open={showPasswordOptions}
          onOpenChange={setShowPasswordOptions}
          onOptionSelect={(option) => {
            if (option === "change") {
              setShowPasswordOptions(false);
              setShowPasswordForm(true);
            } else {
              router.push("/reset-password");
            }
          }}
        />
        <PasswordFormSheet
          open={showPasswordForm}
          onOpenChange={setShowPasswordForm}
          type={"change"}
        />

        {/* Logout Confirmation Dialog */}
        <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Are you sure you want to sign out?
              </AlertDialogTitle>
              <AlertDialogDescription>
                You'll need to sign in again to access your account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleLogout}
                className="bg-destructive hover:bg-destructive/90"
              >
                Sign Out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
