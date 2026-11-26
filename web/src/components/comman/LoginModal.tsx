"use client";
import { closeLoginModal } from "@/redux/features/uiSlice";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/redux/store/store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,

} from "@/components/ui/dialog";
import GoogleLoginBtn from "./GoogleLoginBtn";

export default function LoginModal() {
  const isOpen = useSelector((state: RootState) => state.ui.isLoginModalOpen);
  const dispatch = useDispatch();
  const router = useRouter();

  const handleClose = () => {
    dispatch(closeLoginModal());
  };

  const handleNavigation = (path: string) => {
    dispatch(closeLoginModal());
    router.push(path + "?returnTo=" + window.location.pathname);
  };

  const handleGoogleLogin = () => {
    dispatch(closeLoginModal());
    router.push("/login?returnTo=" + window.location.pathname);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md gap-5 rounded-xl border-[var(--brand-gold)]/25 bg-white px-6 py-7 shadow-[0_30px_80px_-40px_rgba(74,37,66,0.55)]">
        <DialogHeader className="text-center">
          <DialogTitle className="text-[1.65rem] font-medium leading-tight text-[var(--brand-heading)]">
            Welcome Back
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Sign in to access your account and continue shopping
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <Button
            onClick={() => handleNavigation("/login")}
            variant="gradient"
            className="w-full py-6 text-base"
          >
            Sign In To Continue
          </Button>

          <Button
            onClick={() => handleNavigation("/signup")}
            variant="outline"
            className="w-full py-6 text-base border-input hover:bg-muted"
          >
            Create Account To Continue
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border"></span>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-muted-foreground">
                OR CONTINUE WITH
              </span>
            </div>
          </div>

          <GoogleLoginBtn />
        </div>

        <p className="text-xs text-center text-muted-foreground px-4">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </DialogContent>
    </Dialog>
  );
}
