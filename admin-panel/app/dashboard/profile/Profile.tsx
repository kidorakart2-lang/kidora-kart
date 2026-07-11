"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InputPassword } from "@/components/ui/input-password";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Mail,
  Shield,
  Lock,
  CheckCircle,
  ArrowRight,
  Copy,
  Calendar,
  Fingerprint,
  Loader2,
} from "lucide-react";

interface ProfileData {
  _id?: string;
  name?: string;
  email?: string;
  avatar?: string;
  role?: string;
  status?: boolean;
  isEmailVerified?: boolean;
  gender?: string;
  createdAt?: string;
}

export default function Profile({ details }: { details: ProfileData }) {
  if (!details) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero banner + avatar */}
      <Card className="overflow-hidden">
        <div className="relative h-36 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent">
          <div className="absolute -bottom-12 left-6">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              {details.avatar ? (
                <AvatarImage src={details.avatar} alt={details.name} />
              ) : (
                <AvatarFallback className="text-2xl bg-muted">
                  {details.name?.[0] ?? "U"}
                </AvatarFallback>
              )}
            </Avatar>
          </div>
        </div>

        <CardContent className="pt-16 px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">{details.name || "No Name"}</h1>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span className="capitalize">{details.role || "User"}</span>
                <Badge
                  variant={details.status ? "default" : "secondary"}
                  className="ml-1"
                >
                  {details.status ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
            {details.createdAt && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Joined {new Date(details.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="h-10">
          <TabsTrigger value="profile" className="gap-1.5">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5">
            <Lock className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <ProfileTab details={details} />
        </TabsContent>

        <TabsContent value="security" className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <SecurityTab email={details.email} isEmailVerified={details.isEmailVerified} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ─── Profile Tab ─── */

function ProfileTab({ details }: { details: ProfileData }) {
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    if (!details._id) return;
    navigator.clipboard.writeText(details._id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Contact */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Contact
          </h3>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium truncate">{details.email || "N/A"}</p>
              {details.isEmailVerified !== undefined && (
                <Badge
                  variant="outline"
                  className={details.isEmailVerified ? "text-green-600 mt-1" : "text-amber-600 mt-1"}
                >
                  {details.isEmailVerified ? "Verified" : "Not Verified"}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gender</p>
              <p className="font-medium capitalize">{details.gender || "Not specified"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Account
          </h3>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Fingerprint className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">User ID</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm truncate">{details._id || "N/A"}</p>
                {details._id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={handleCopyId}
                  >
                    {copied ? (
                      <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Shield className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="font-medium capitalize">{details.role || "User"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={details.status ? "default" : "secondary"}>
                {details.status ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Security Tab ─── */

function SecurityTab({
  email,
  isEmailVerified,
}: {
  email?: string;
  isEmailVerified?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPasswordOptions, setShowPasswordOptions] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const handleVerifyEmail = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/website/user/verify-user", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const resData = await response.json();
      if (!response.ok || !resData._status) {
        toast({ title: "Error", description: resData._message || "Something went wrong." });
      }
      if (resData._status === true) {
        Cookies.set("verify", resData._token, {
          expires: new Date(Date.now() + 10 * 60 * 1000),
        });
        router.push(`/dashboard/verify-email?email=${email}`);
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Security
        </h3>

        {/* Change Password */}
        <button
          onClick={() => setShowPasswordOptions(true)}
          className="w-full flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-left">
              <p className="font-medium">Change Password</p>
              <p className="text-sm text-muted-foreground">Update your password regularly</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Verify Email */}
        {!isEmailVerified && (
          <button
            onClick={handleVerifyEmail}
            disabled={loading}
            className="w-full flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-left">
                <p className="font-medium flex items-center gap-2">
                  Verify Email
                  <Badge variant="secondary" className="text-xs">Pending</Badge>
                </p>
                <p className="text-sm text-muted-foreground">Verify your email address</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}

        {isEmailVerified && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
            <div className="p-2 rounded-lg bg-muted">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium">Email Verified</p>
              <p className="text-sm text-muted-foreground">Your email is verified</p>
            </div>
          </div>
        )}

        {/* Dialogs */}
        <PasswordOptionsDialog
          open={showPasswordOptions}
          onOpenChange={setShowPasswordOptions}
          onOptionSelect={(option) => {
            setShowPasswordOptions(false);
            if (option === "change") {
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
      </CardContent>
    </Card>
  );
}

/* ─── Password Dialogs ─── */

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
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>Choose how you want to change your password.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <Button
            variant="outline"
            className="justify-start gap-2"
            onClick={() => onOptionSelect("change")}
          >
            <Lock className="h-4 w-4" />
            Change Password
          </Button>
          <Button
            variant="outline"
            className="justify-start gap-2 text-amber-600 hover:text-amber-700"
            onClick={() => onOptionSelect("forgot")}
          >
            <Lock className="h-4 w-4" />
            I forgot my password
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
      const response = await fetch("/api/website/user/change-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword: currentPassword, newPassword }),
      });
      const resData = await response.json();
      if (!response.ok || !resData._status) {
        toast({ title: "Error", description: resData._message || "Something went wrong." });
      }
      if (resData._status === true) {
        toast({ title: "Success", description: "Password changed successfully." });
        onOpenChange(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="px-6 py-8">
        <SheetHeader className="mb-6">
          <SheetTitle>Change Password</SheetTitle>
          <SheetDescription>Enter your current password and a new password.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <InputPassword
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              label="Current Password"
            />
          </div>
          <div className="space-y-1">
            <InputPassword
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              label="New Password"
            />
          </div>
          <div className="space-y-1">
            <InputPassword
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              label="Confirm New Password"
            />
          </div>
          <Button type="submit" disabled={isLoading} className="w-full mt-4">
            {isLoading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
