"use client";

import {
  ArrowRight,
  CheckCircle,
  Lock,
  Mail,
  Loader2,
  MapPin,
  Save,
} from "lucide-react";
import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export interface SettingsData {
  email?: string;
  isEmailVerified?: boolean;
}

export interface StoreSettingsData {
  storePickupPincode: string;
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
      <SheetContent className="bg-card px-6 py-8 rounded-l-2xl shadow-2xl animate-in slide-in-from-right duration-300 ease-out">
        <SheetHeader className="text-center mb-6">
          <SheetTitle className="text-2xl font-semibold text-foreground">
            Change Password
          </SheetTitle>
          <SheetDescription className="text-muted-foreground">
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
              className="focus:ring-2 focus:ring-ring rounded-lg transition-all duration-200"
            />
          </div>

          <div className="space-y-1">
            <InputPassword
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              label="New Password"
              className="focus:ring-2 focus:ring-ring rounded-lg transition-all duration-200"
            />
          </div>

          <div className="space-y-1">
            <InputPassword
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              label="Confirm New Password"
              className="focus:ring-2 focus:ring-ring rounded-lg transition-all duration-200"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 text-primary-foreground font-semibold py-3 rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300 disabled:opacity-60"
          >
            {isLoading ? "Processing..." : "Update Password"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// Store Pickup Pincode Editor
function PickupPincodeEditor({
  initialPincode,
}: {
  initialPincode: string;
}) {
  const { toast } = useToast();
  const [pincode, setPincode] = useState(initialPincode);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPincode(initialPincode);
  }, [initialPincode]);

  const handleSave = async () => {
    if (!/^\d{6}$/.test(pincode)) {
      toast({
        title: "Error",
        description: "Pincode must be a valid 6-digit number",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storePickupPincode: pincode }),
      });

      const resData = await response.json();
      if (!response.ok || !resData._status) {
        toast({
          title: "Error",
          description: resData._message || "Failed to save",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Pickup pincode updated successfully",
      });
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground mb-3">
        Store Settings
      </h3>
      <div className="p-4 bg-card rounded-lg border space-y-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-muted rounded-lg">
            <MapPin size={18} className="text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">Store Pickup Pincode</p>
            <p className="text-xs text-muted-foreground">
              Used as fallback for shipping estimates when Shiprocket pickup
              locations are unavailable
            </p>
          </div>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label htmlFor="pickupPincode" className="text-xs text-muted-foreground mb-1 block">
              6-digit pincode
            </Label>
            <Input
              id="pickupPincode"
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="342005"
              maxLength={6}
              className="w-full"
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={saving || pincode === initialPincode}
            className="gap-2"
            size="sm"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsSection({
  data,
  storeSettings,
}: {
  data?: SettingsData;
  storeSettings?: StoreSettingsData;
}) {
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

      {/* Store Settings Section */}
      <PickupPincodeEditor initialPincode={storeSettings?.storePickupPincode ?? ""} />

      {/* Security Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground mb-3">Security</h3>

        {/* Change Password Button */}
        <button
          onClick={() => setShowPasswordOptions(true)}
          className="w-full flex items-center justify-between p-4 bg-card rounded-lg border hover:border-accent hover:shadow-md transition-all duration-300 group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg group-hover:bg-accent transition-colors duration-300">
              <Lock size={18} className="text-primary" />
            </div>
            <div className="text-left">
              <p className="font-medium text-foreground">Change Password</p>
              <p className="text-sm text-muted-foreground">
                Update your password regularly
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </button>

        {/* Verify Email Button */}
        {data?.isEmailVerified ? null : (
          <button
            onClick={() => handleVerifyClick("email")}
            className="w-full flex items-center justify-between p-4 bg-card rounded-lg border hover:border-accent hover:shadow-md transition-all duration-300 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg group-hover:bg-accent transition-colors duration-300">
                <Mail size={18} className="text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground flex items-center gap-2">
                  Verify Email
                  {!data?.isEmailVerified && (
                    <span className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs rounded-full">
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
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
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
