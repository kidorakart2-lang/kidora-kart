"use client";

import { ArrowRight, CheckCircle, Lock, Mail, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { logout } from "@/redux/features/auth";
import { useDispatch } from "react-redux";
import Cookies from "js-cookie";
import { getAuthToken } from "@/lib/getAuthToken";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoadingUi } from "./Cart";

import type { UserDetails } from "@/types";

export default function SettingsSection({ data }: { data: UserDetails }) {
  const router = useRouter();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
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
    <div className="space-y-8">
      <LoadingUi hidden={loading} />
      {/* Security Section */}
      <div className="space-y-6">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4">Security</h3>

        {/* Forgot Password Button */}
        <Link href="/reset-password">
          <button
            className="w-full flex items-center justify-between p-4 bg-background/80 rounded-lg border border-border hover:border-border hover:shadow-md transition-all duration-300 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg group-hover:bg-muted/80 transition-colors duration-300">
                <Lock size={18} className="text-muted-foreground" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">Forgot Password</p>
                <p className="text-sm text-muted-foreground">
                  Reset your password via email
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        </Link>

        {/* Change Password Button */}
        <Link href="/change-password">
          <button
            className="w-full flex items-center justify-between p-4 bg-background/80 rounded-lg border border-border hover:border-border hover:shadow-md transition-all duration-300 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg group-hover:bg-muted/80 transition-colors duration-300">
                <Lock size={18} className="text-muted-foreground" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">Change Password</p>
                <p className="text-sm text-muted-foreground">
                  Update your password regularly
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        </Link>

        {/* Verify Email Button */}
        {data?.isEmailVerified ? null : (
          <button
            onClick={() => handleVerifyClick("email")}
            className="w-full flex items-center justify-between p-4 bg-background/80 rounded-lg border border-border hover:border-border hover:shadow-md transition-all duration-300 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg group-hover:bg-muted/80 transition-colors duration-300">
                <Mail size={18} className="text-muted-foreground" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground flex items-center gap-2">
                  Verify Email
                  {!data?.isEmailVerified && (
                    <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">
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
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
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
