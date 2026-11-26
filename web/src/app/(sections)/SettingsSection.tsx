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
import { getAuthToken } from "@/lib/cookies";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LoadingOverlay from "@/components/comman/LoadingOverlay";

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
        const response = await fetch("/api/website/user/verify-user", {
            method: "POST",
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
            secure: window.location.protocol === "https:",
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
      await fetch("/api/website/user/logout", {
        method: "POST",
      });
    } catch {
      // Silently handle - cookie will be stale but harmless
    }
    Cookies.remove("userToken_client", { path: "/" });
    Cookies.remove("userToken", { path: "/" }); // cleanup old name
    dispatch(logout());
    router.push("/");
  };



  return (
    <div className="space-y-8">
      <LoadingOverlay hidden={loading} />
      {/* Security Section */}
      <div className="space-y-6">
        <h3 className="mb-4 text-[10px] uppercase tracking-[0.2em] text-[var(--brand-ink)]/45">Security</h3>

        {/* Forgot Password Button */}
        <Link href="/reset-password">
          <button
            className="group flex w-full items-center justify-between rounded-lg border border-[var(--brand-gold)]/25 bg-white p-4 transition-all duration-300 hover:border-[var(--brand-gold)]/50 hover:shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-full border border-[var(--brand-gold)]/35 bg-[var(--brand-gold)]/10 text-[var(--brand-gold-dark)]">
                <Lock size={15} strokeWidth={1.6} />
              </div>
              <div className="text-left">
                <p className="display-heading text-[15px]">Forgot Password</p>
                <p className="text-[11.5px] text-[var(--brand-ink)]/50">
                  Reset your password via email
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-[var(--brand-gold-dark)]/60 transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--brand-gold-dark)]" />
          </button>
        </Link>

        {/* Change Password Button */}
        <Link href="/change-password">
          <button
            className="group flex w-full items-center justify-between rounded-lg border border-[var(--brand-gold)]/25 bg-white p-4 transition-all duration-300 hover:border-[var(--brand-gold)]/50 hover:shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-full border border-[var(--brand-gold)]/35 bg-[var(--brand-gold)]/10 text-[var(--brand-gold-dark)]">
                <Lock size={15} strokeWidth={1.6} />
              </div>
              <div className="text-left">
                <p className="display-heading text-[15px]">Change Password</p>
                <p className="text-[11.5px] text-[var(--brand-ink)]/50">
                  Update your password regularly
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-[var(--brand-gold-dark)]/60 transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--brand-gold-dark)]" />
          </button>
        </Link>

        {/* Verify Email Button */}
        {data?.isEmailVerified ? null : (
          <button
            onClick={() => handleVerifyClick("email")}
            className="group flex w-full items-center justify-between rounded-lg border border-[var(--brand-gold)]/25 bg-white p-4 transition-all duration-300 hover:border-[var(--brand-gold)]/50 hover:shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-full border border-[var(--brand-gold)]/35 bg-[var(--brand-gold)]/10 text-[var(--brand-gold-dark)]">
                <Mail size={15} strokeWidth={1.6} />
              </div>
              <div className="text-left">
                <p className="display-heading flex items-center gap-2 text-[15px]">
                  Verify Email
                  {!data?.isEmailVerified && (
                    <span className="rounded-full border border-[var(--brand-gold)]/35 bg-[var(--brand-cream)] px-2 py-0.5 text-[9.5px] uppercase tracking-[0.12em] text-[var(--brand-ink)]/50">
                      Pending
                    </span>
                  )}
                  {data?.isEmailVerified && (
                    <CheckCircle size={14} className="text-[var(--brand-gold-dark)]" />
                  )}
                </p>
                <p className="text-[11.5px] text-[var(--brand-ink)]/50">
                  {data?.isEmailVerified
                    ? "Your email is verified"
                    : "Verify your email address"}
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-[var(--brand-gold-dark)]/60 transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--brand-gold-dark)]" />
          </button>
        )}

        {/* Logout Button */}
        <div className="border-t border-[var(--brand-gold)]/20 pt-5">
          <Button
            onClick={() => setShowLogoutDialog(true)}
            variant="outline"
            className="flex items-center gap-2 rounded-full border-destructive/35 bg-transparent text-[10.5px] uppercase tracking-[0.16em] text-destructive transition-colors duration-300 hover:bg-destructive/5"
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
