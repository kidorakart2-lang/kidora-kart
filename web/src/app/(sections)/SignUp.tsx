"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { register, setProfile } from "@/redux/features/auth";
import { clearGuestCart } from "@/redux/features/cart";
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
import GoogleLoginBtn from "@/components/comman/GoogleLoginBtn";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, Mail, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const SignUpPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState(""); //  error state
  const [loading, setLoading] = useState(false); // 👈 loading state

  const router = useRouter();
  const dispatch = useDispatch();
  const returnTo = useSearchParams().get("returnTo");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(""); // clear error when typing again
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(""); // reset error before submission
    setLoading(true); // show loading state

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}api/website/user/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();
      if (!response.ok || !data._status) {
        return setError(
          data._message || "Failed to sign up. Please try again."
        );
      }

      dispatch(register(data._token));
      dispatch(setProfile(data._data));

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

      router.push(returnTo || "/profile?tab=profile");
    } catch (err: unknown) {
      return setError(
        err instanceof Error ? err.message : "Failed to sign up. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[550px] flex justify-center bg-gray-50  p-4 relative overflow-hidden">
      <Card className={"w-full max-w-md"}>
        <CardHeader>
          <CardTitle className={"text-center text-2xl md:text-3xl"}>
            Create Your Account
          </CardTitle>
          <CardDescription className={"text-center text-sm"}>
            Create your account to get started
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
                  className="block text-gray-700 mb-2 font-medium text-sm"
                >
                  Full Name
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-black z-10" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-3 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md"
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
                    className="w-full pl-10 pr-4 py-3 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md"
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
              <div>
                <Label
                  htmlFor="password"
                  className="block text-gray-700 mb-2 font-medium text-sm"
                >
                  Password
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-black z-10" />
                  </div>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="********"
                    className="w-full pl-10 pr-4 py-3 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md"
                    required
                    aria-required="true"
                    aria-describedby="password-description"
                  />
                </div>
                <span id="password-description" className="sr-only">
                  Enter a secure password
                </span>
              </div>

              {/* Error Message */}
              {error && (
                <div
                  className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 p-3 rounded-xl text-sm text-center shadow-sm"
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
                className={`w-full py-3 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                  loading
                    ? "bg-amber-400 cursor-not-allowed opacity-70"
                    : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
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
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-amber-600 hover:text-amber-700 font-semibold hover:underline transition-colors"
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
