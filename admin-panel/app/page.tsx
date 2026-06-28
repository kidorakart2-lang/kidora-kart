"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(
        "/api/admin/user/login",
        {
          email,
          password,
        },
        { withCredentials: true }
      );

      if (response.status !== 200) {
        return toast({
          title: "Login Failed",
          description: response.data._message,
          variant: "destructive",
        });
      }
      if (!response.data._status) {
        toast({
          title: "Login failed",
          description: response.data._message,
          variant: "destructive",
        });
        return;
      }

      // Backend sets httpOnly cookie — no need for js-cookie
      toast({
        title: "Login successful",
        description: "Welcome to the admin panel.",
      });

      router.push("/dashboard");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { _message?: string } } };
      toast({
        title: "Login failed",
        description: err.response?.data?._message || "Login failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      <Card className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500 border-border/50 shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-xl flex items-center justify-center mb-4 animate-in zoom-in duration-300 delay-100">
            <svg
              className="w-8 h-8 text-primary-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">
            Admin Panel
          </CardTitle>
          <CardDescription className="text-base">
            Enter your credentials to access the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2 animate-in slide-in-from-left duration-300 delay-200">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="transition-all duration-200 focus:scale-[1.02]"
              />
            </div>
            <div className="space-y-2 animate-in slide-in-from-left duration-300 delay-300">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="transition-all duration-200 focus:scale-[1.02]"
              />
            </div>
            <Button
              type="submit"
              className="w-full animate-in slide-in-from-bottom duration-300 delay-400 transition-all hover:scale-[1.02]"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></span>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

         
        </CardContent>
      </Card>


    </div>
  );
}
