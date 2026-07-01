"use client";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/redux/store/store";
import { closePhoneModal, openPhoneModal } from "@/redux/features/uiSlice";
import { setProfile } from "@/redux/features/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Phone, Loader2 } from "lucide-react";
import { getAuthToken } from "@/lib/getAuthToken";
import { siteConfig } from "@/lib/utils";
import { toast } from "sonner";

export default function PhoneNumberModal() {
  const isOpen = useSelector((state: RootState) => state.ui.isPhoneModalOpen);
  const userDetails = useSelector((state: RootState) => state.auth.details);
  const dispatch = useDispatch();

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isClosing, setIsClosing] = useState(false);

  // Check for showPhoneModal flag after Google login redirect
  useEffect(() => {
    const shouldShowModal = localStorage.getItem("showPhoneModal");
    if (shouldShowModal === "true") {
      localStorage.removeItem("showPhoneModal");
      // Delay slightly to allow page to load
      setTimeout(() => {
        dispatch(openPhoneModal());
      }, 1500);
    }
  }, [dispatch]);

  // Validate Indian phone number (10 digits)
  const validatePhone = (number: string) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(number);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      dispatch(closePhoneModal());
      setIsClosing(false);
      setPhone("");
      setError("");
    }, 300);
  };

  const handleSave = async () => {
    // Validate phone number
    if (!phone.trim()) {
      setError("Please enter your phone number");
      return;
    }

    if (!validatePhone(phone)) {
      setError("Please enter a valid 10-digit Indian phone number");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const token = getAuthToken();
      const formData = new FormData();
      formData.append("mobile", phone);

      const response = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "api/website/user/update-profile",
        {
          method: "PUT",
          body: formData,
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 429) {
        setError("Too many requests, please try again later");
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (data._status) {
        toast.success("Phone number saved successfully!");
        dispatch(
          setProfile({
            ...userDetails,
            mobile: phone,
          })
        );
        handleClose();
      } else {
        setError(data._message || "Failed to save phone number");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(value);
    if (error) setError("");
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-[1500] w-80 bg-background rounded-xl shadow-2xl border border-brand-100 overflow-hidden transition-all duration-300 ease-out ${
        isClosing ? "animate-phone-modal-out" : "animate-phone-modal-in"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-brand-700 to-brand-800">
        <div className="flex items-center gap-2 text-white">
          <Phone size={18} />
          <span className="font-medium text-sm">Add Phone Number</span>
        </div>
        <button
          onClick={handleClose}
          className="text-white/80 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="p-4">
        <p className="text-xs text-muted-foreground mb-3">
          Add your phone number to receive order updates and offers.
        </p>

        <div className="flex gap-2">
          <div className="flex items-center px-3 bg-muted rounded-lg text-sm text-muted-foreground border border-border">
            {siteConfig.contact.countryCode}
          </div>
          <Input
            id="phone-number"
            type="tel"
            value={phone}
            onChange={handlePhoneChange}
            placeholder="Enter phone number"
            className="flex-1 text-sm"
            maxLength={10}
            aria-label="Phone number"
          />
        </div>

        {error && (
          <p className="text-xs text-red-500 mt-2 animate-fadeIn">{error}</p>
        )}

        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
            className="flex-1 text-xs"
            disabled={loading}
          >
            Later
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={loading || !phone}
            className="flex-1 text-xs bg-gradient-to-r from-brand-700 to-brand-800 hover:from-brand-800 hover:to-brand-900"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
          </Button>
        </div>
      </div>


    </div>
  );
}
