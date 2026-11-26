"use client";
import GoogleLoginBtn from "@/components/comman/GoogleLoginBtn";
import InputPassword from "@/components/ui/input-password";
import { login, setProfile } from "@/redux/features/auth";
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
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/redux/store/store";

import { Label } from "@/components/ui/label";
import { Mail } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import BrandLogo from "@/components/comman/BrandLogo";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [formState, setFormState] = useState<{ errors: Record<string, string>; isSubmitting: boolean }>({
    errors: {},
    isSubmitting: false,
  });

  const [apiError, setApiError] = useState(""); // 👈 new: server error message

  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const router = useRouter();
  const returnTo = useSearchParams().get("returnTo");

  // Read guest data from Redux state (persisted in localStorage via redux-persist)
  const guestCartItems = useSelector((state: RootState) => state.cart.cartItems);
  const guestWishlistItems = useSelector((state: RootState) => state.wishlist.wishlistItems);

  const validate = () => {
    const errors: Record<string, string> = {};

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)) {
      errors.email = "Enter a valid email";
    }

    if (!formData.password.trim()) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    return errors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormState((prev) => ({
      ...prev,
      errors: { ...prev.errors, [e.target.name]: "" },
    }));
    setApiError(""); // clear any previous API error
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormState({ ...formState, errors });
      return;
    }

    setFormState((prev) => ({ ...prev, isSubmitting: true }));
    setApiError(""); // reset error

    try {
      const response = await fetch("/api/website/user/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );
      const data = await response.json();
      if (!response.ok || !data._status) {
        return setApiError(
          data._message || "Failed to login. Please try again."
        );
      }

      if (!data._status) {
        return setApiError(data._message || "Invalid credentials");
      }

      dispatch(login());
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

      router.push(returnTo || "/");
    } catch (error) {
      return setApiError(error instanceof Error ? error.message : "Failed to login. Please try again.");
    } finally {
      setFormState((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const logo = useSelector((state: RootState) => state.logo.logo);

  return (
    <main className="relative flex min-h-[80vh] items-center justify-center overflow-hidden bg-white px-4 py-12">
      <Card className="w-full max-w-md rounded-xl border border-[var(--brand-gold)]/25 bg-white shadow-none">
        <div className="flex justify-center mt-7">
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
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="display-heading text-center text-2xl md:text-3xl">
            Welcome Back
          </CardTitle>
          <CardDescription className="mt-1 text-center text-[12px] text-[var(--brand-ink)]/65">
            Log in to your account and continue shopping
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
            aria-label="Login form"
          >
            {/* Email */}
            <div>
              <Label
                htmlFor="email"
                className="mb-2 block text-[10.5px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/65"
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
className={`w-full rounded-lg border border-[var(--brand-gold)]/30 bg-white py-3 pl-10 pr-4 text-[var(--brand-ink)] transition-all duration-300 focus:border-[var(--brand-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)]/30 ${
                       formState.errors.email ? "border-destructive" : ""
                     }`}
                  aria-required="true"
                  aria-invalid={!!formState.errors.email}
                  aria-describedby="email-error"
                />
              </div>
              {formState.errors.email && (
                <p id="email-error" className="text-destructive text-xs mt-1" role="alert" aria-live="polite">
                  {formState.errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <InputPassword
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="********"
                inputClassName={`w-full rounded-lg border border-[var(--brand-gold)]/30 bg-white py-3 text-[var(--brand-ink)] transition-all duration-300 focus:border-[var(--brand-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)]/30 ${
                  formState.errors.password ? "border-destructive" : ""
                }`}
                aria-required="true"
                aria-invalid={!!formState.errors.password}
                aria-describedby="password-error"
              />
            </div>
            {formState.errors.password && (
              <p id="password-error" className="text-destructive text-xs mt-1" role="alert" aria-live="polite">
                {formState.errors.password}
              </p>
            )}

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link
                href="/reset-password"
                className="text-[11px] text-[var(--brand-plum)] underline decoration-[var(--brand-gold)]/60 underline-offset-4 transition-colors hover:no-underline"
                aria-label="Forgot password?"
              >
                Forgot Password?
              </Link>
            </div>

            {/* API Error Message */}
            {apiError && (
              <div
                className="bg-destructive/10 backdrop-blur-sm border border-destructive text-destructive p-3 rounded-xl text-sm text-center shadow-sm"
                role="alert"
                aria-live="polite"
              >
                {apiError}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={formState.isSubmitting}
               className={`w-full rounded-full py-3.5 text-[11px] uppercase tracking-[0.18em] transition-all duration-300 ${
                 formState.isSubmitting
                   ? "cursor-not-allowed bg-[var(--brand-plum)]/45 text-[var(--brand-cream)]"
                  : "btn-gold"
              }`}
              aria-label={
                formState.isSubmitting
                  ? "Logging in, please wait"
                  : "Log in to your account"
              }
              aria-busy={formState.isSubmitting}
            >
              {formState.isSubmitting ? (
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
                  Logging in...
                </span>
              ) : (
                "Log In"
              )}
            </button>
          </form>

          <div className="my-6 relative" role="separator" aria-label="or">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--brand-gold)]/25"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-[0.18em]">
              <span className="bg-white px-4 text-[var(--brand-ink)]/65">
                Or continue with
              </span>
            </div>
          </div>

          <div className="mb-6">
            <GoogleLoginBtn />
          </div>

          <p className="text-center text-[12px] text-[var(--brand-ink)]/65">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="text-[var(--brand-plum)] underline decoration-[var(--brand-gold)]/60 underline-offset-4 transition-colors hover:no-underline"
              aria-label="Navigate to sign up page"
            >
              Sign Up
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
};

export default LoginPage;
