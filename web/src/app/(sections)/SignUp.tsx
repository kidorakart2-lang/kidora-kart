"use client";
import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { register, setProfile } from "@/redux/features/auth";
import { clearGuestCart } from "@/redux/features/cart";

import { clearGuestWishlist } from "@/redux/features/wishlist";
import {
  syncGuestCartToServer,
  syncGuestWishlistToServer,
} from "@/lib/syncGuestData";
import { useQueryClient } from "@tanstack/react-query";
import { cartKeys } from "@/lib/useCart";
import { wishlistKeys } from "@/lib/useWishlist";
import { userKeys } from "@/lib/useProfile";
import Link from "next/link";
import GoogleLoginBtn from "@/components/comman/GoogleLoginBtn";
import BrandLogo from "@/components/comman/BrandLogo";
import StrongPasswordInput from "@/components/comman/StrongPasswordInput";
import { Label } from "@/components/ui/label";
import { Mail, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store/store";
import Image from "next/image";

const SignUpPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState(""); //  error state
  const [loading, setLoading] = useState(false); // 👈 loading state
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState(false);
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  const router = useRouter();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const returnTo = useSearchParams().get("returnTo");

  // Read guest data from Redux state (persisted in localStorage via redux-persist)
  const guestCartItems = useSelector((state: RootState) => state.cart.cartItems);
  const guestWishlistItems = useSelector((state: RootState) => state.wishlist.wishlistItems);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(""); // clear error when typing again
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(""); // reset error before submission
    setLoading(true); // show loading state

    try {
      if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken) {
        setTurnstileError(true);
        return setError("Please complete the security check.");
      }

      const response = await fetch("/api/website/user/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, turnstileToken }),
        }
      );

      const data = await response.json();
      if (!response.ok || !data._status) {
        // If the error is Turnstile-related, reset the widget
        if (
          data._message?.toLowerCase().includes("verification") ||
          data._message?.toLowerCase().includes("bot")
        ) {
          turnstileRef.current?.reset();
          setTurnstileToken(null);
        }
        return setError(
          data._message || "Failed to sign up. Please try again."
        );
      }

      dispatch(register());
      dispatch(setProfile(data._data));
      // Sync guest cart and wishlist to server (read from Redux state persisted in localStorage)
      if ((guestCartItems?.length ?? 0) > 0 || (guestWishlistItems?.length ?? 0) > 0) {
        await Promise.all([
          syncGuestCartToServer(data._token, guestCartItems),
          syncGuestWishlistToServer(data._token, guestWishlistItems),
        ]);
        dispatch(clearGuestCart());
        dispatch(clearGuestWishlist());
      }

      // Invalidate React Query caches — hooks in Header/GuestDataInitializer auto-refetch
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
      queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.all });

      router.push(returnTo || "/profile?tab=profile");
    } catch (err: unknown) {
      return setError(
        err instanceof Error ? err.message : "Failed to sign up. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const logo = useSelector((state: RootState) => state.logo.logo);

  return (
    <main className="relative flex min-h-[80vh] items-center justify-center overflow-hidden bg-white px-4 py-12">
      <Card className="w-full max-w-md rounded-xl border border-[var(--brand-gold)]/25 bg-white shadow-none">
        <div className="flex justify-center mt-6">
          <Link href="/">
            {logo ? (
              <Image
                src={logo}
                alt="Logo"
                width={180}
                height={60}
                className="h-12 w-auto object-contain"
              />
            ) : (
              <BrandLogo size="md" />
            )}
          </Link>
        </div>
        <CardHeader className="pb-2 pt-6">
          <p className="eyebrow mb-2 text-center text-[10px]">
            <span className="mr-1.5">✦</span>
            Join Ratnavya
          </p>
          <CardTitle className="display-heading text-center text-2xl md:text-3xl">
            Create your <span className="accent-italic">account</span>
          </CardTitle>
          <CardDescription className="mt-1 text-center text-[12px] text-[var(--brand-ink)]/50">
            Save your favourites, track orders and check out faster
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
              aria-label="Sign up form"
            >
              {/* Name */}
              <div>
                <Label
                  htmlFor="name"
                  className="mb-2 block text-[10.5px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/55"
                >
                  Full Name
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={16} className="z-10 text-[var(--brand-gold-dark)]" strokeWidth={1.6} />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full rounded-lg border border-[var(--brand-gold)]/30 bg-white py-3 pl-10 pr-4 text-[var(--brand-ink)] transition-all duration-300 focus:border-[var(--brand-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)]/30"
                    required
                    aria-required="true"
                    aria-describedby="name-description"
                  />
                </div>
                <span id="name-description" className="sr-only">
                  Enter your full name
                </span>
              </div>

              {/* Email */}
              <div>
                <Label
                  htmlFor="email"
                  className="mb-2 block text-[10.5px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/55"
                >
                  Email Address
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={16} className="z-10 text-[var(--brand-gold-dark)]" strokeWidth={1.6} />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@mail.com"
                    className="w-full rounded-lg border border-[var(--brand-gold)]/30 bg-white py-3 pl-10 pr-4 text-[var(--brand-ink)] transition-all duration-300 focus:border-[var(--brand-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)]/30"
                    required
                    aria-required="true"
                    aria-describedby="email-description"
                  />
                </div>
                <span id="email-description" className="sr-only">
                  Enter your email address
                </span>
              </div>

              {/* Password */}
              <StrongPasswordInput
                value={formData.password}
                onChange={(val) => {
                  setError("");
                  setFormData((prev) => ({ ...prev, password: val }));
                }}
              />

              {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
                <>
                  <div className="flex justify-center">
                    <Turnstile
                      ref={turnstileRef}
                      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                      options={{
                        theme: "auto",
                      }}
                      onSuccess={(token) => {
                        setTurnstileToken(token);
                        setTurnstileError(false);
                      }}
                      onExpire={() => {
                        setTurnstileToken(null);
                        setTurnstileError(true);
                      }}
                      onError={() => {
                        setTurnstileToken(null);
                        setTurnstileError(true);
                      }}
                    />
                  </div>
                  {turnstileError && !turnstileToken && (
                    <p className="text-destructive text-xs text-center" role="alert">
                      Please complete the security check
                    </p>
                  )}
                </>
              )}

              {/* Error Message */}
              {error && (
                <div
                  className="bg-destructive/10 backdrop-blur-sm border border-destructive text-destructive p-3 rounded-xl text-sm text-center shadow-sm"
                  role="alert"
                  aria-live="polite"
                >
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                 className={`w-full rounded-full py-3.5 text-[11px] uppercase tracking-[0.18em] transition-all duration-300 ${
                   loading
                     ? "cursor-not-allowed bg-[var(--brand-plum)]/45 text-[var(--brand-cream)]"
                    : "btn-gold"
                }`}
                aria-label={
                  loading
                    ? "Creating your account, please wait"
                    : "Sign up for an account"
                }
                aria-busy={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  "Create Your Account"
                )}
              </button>
            </form>

            <div className="my-6 relative" role="separator" aria-label="or">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--brand-gold)]/25"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-[0.18em]">
                <span className="bg-white px-4 text-[var(--brand-ink)]/40">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mb-6">
              <GoogleLoginBtn />
            </div>

            <p className="text-center text-[12px] text-[var(--brand-ink)]/55">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-[var(--brand-plum)] underline decoration-[var(--brand-gold)]/60 underline-offset-4 transition-colors hover:no-underline"
                aria-label="Navigate to login page"
              >
                Log In
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default SignUpPage;
