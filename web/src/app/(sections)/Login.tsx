"use client";
import GoogleLoginBtn from "@/components/comman/GoogleLoginBtn";
import InputPassword from "@/components/ui/input-password";
import { login, setProfile } from "@/redux/features/auth";
import { clearGuestCart } from "@/redux/features/cart";
import Cookies from "js-cookie";
import { clearGuestWishlist } from "@/redux/features/wishlist";
import {
  syncGuestCartToServer,
  syncGuestWishlistToServer,
  getGuestCartFromStorage,
  getGuestWishlistFromStorage,
} from "@/lib/syncGuestData";
import {
  fetchAndDispatchCart,
  fetchAndDispatchWishlist,
} from "@/lib/fetchCartWislist";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useDispatch } from "react-redux";

import { Label } from "@/components/ui/label";
import { Lock, Mail } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
  const router = useRouter();
  const returnTo = useSearchParams().get("returnTo");

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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}api/website/user/login`,
        {
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

      dispatch(login(data._token));
      dispatch(setProfile(data._data));
      Cookies.set("userToken", data._token, { expires: 7, path: "/", sameSite: "lax" });

      // Sync guest cart and wishlist to server
      const guestCart = getGuestCartFromStorage();
      const guestWishlist = getGuestWishlistFromStorage();

      if (guestCart.length > 0 || guestWishlist.length > 0) {
        // Sync guest data to server
        await Promise.all([
          syncGuestCartToServer(data._token, guestCart),
          syncGuestWishlistToServer(data._token, guestWishlist),
        ]);

        // Clear guest data from localStorage
        dispatch(clearGuestCart());
        dispatch(clearGuestWishlist());

        // Fetch updated cart and wishlist from server
        await Promise.all([
          fetchAndDispatchCart(dispatch),
          fetchAndDispatchWishlist(dispatch),
        ]);
      }

      router.push(returnTo || "/");
    } catch (error) {
      return setApiError(error instanceof Error ? error.message : "Failed to login. Please try again.");
    } finally {
      setFormState((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  return (
    <main className="min-h-[550px] flex justify-center bg-gray-50 p-4 relative overflow-hidden">
      <Card className={"w-full max-w-md"}>
        <CardHeader>
          <CardTitle className={"text-center text-2xl md:text-3xl"}>
            Welcome Back
          </CardTitle>
          <CardDescription className={"text-center text-sm"}>
            Log in to access your account and continue shopping
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
                className="block text-gray-700 mb-2 font-medium text-sm"
              >
                Email Address
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-black z-10" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@mail.com"
                  className={`w-full pl-10 pr-4 py-3 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md ${
                    formState.errors.email ? "border-red-400" : ""
                  }`}
                  aria-required="true"
                  aria-invalid={!!formState.errors.email}
                  aria-describedby="email-error"
                />
              </div>
              {formState.errors.email && (
                <p id="email-error" className="text-red-500 text-xs mt-1">
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
                className={`w-full  py-3 bg-white/70 backdrop-blur-sm  rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300  ${
                  formState.errors.password ? "border-red-400" : ""
                }`}
                aria-required="true"
                aria-invalid={!!formState.errors.password}
                aria-describedby="password-error"
              />
            </div>
            {formState.errors.password && (
              <p id="password-error" className="text-red-500 text-xs mt-1">
                {formState.errors.password}
              </p>
            )}

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link
                href="/reset-password"
                className="text-xs text-amber-600 hover:underline"
                aria-label="Forgot password?"
              >
                Forgot Password?
              </Link>
            </div>

            {/* API Error Message */}
            {apiError && (
              <div
                className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 p-3 rounded-xl text-sm text-center shadow-sm"
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
              className={`w-full py-3 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                formState.isSubmitting
                  ? "bg-amber-400 cursor-not-allowed opacity-70"
                  : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
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
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white/80 text-gray-500 font-medium">
                Or continue with
              </span>
            </div>
          </div>

          <div className="mb-6">
            <GoogleLoginBtn />
          </div>

          <p className="text-center text-gray-600 text-sm">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="text-amber-600 hover:text-amber-700 font-semibold hover:underline transition-colors"
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
