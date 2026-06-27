"use client";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/redux/store/store";
import { closePhoneModal, openPhoneModal } from "@/redux/features/uiSlice";
import { setProfile } from "@/redux/features/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Phone, Loader2 } from "lucide-react";
import axios from "axios";
import Cookies from "js-cookie";
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
      const token = Cookies.get("user");
      const formData = new FormData();
      formData.append("mobile", phone);

      const response = await axios.put(
        process.env.NEXT_PUBLIC_API_URL + "api/website/user/update-profile",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data._status) {
        toast.success("Phone number saved successfully!");
        // Update the profile in redux
        dispatch(
          setProfile({
            ...userDetails,
            mobile: phone,
          })
        );
        handleClose();
      } else {
        setError(response.data._message || "Failed to save phone number");
      }
    } catch (error) {
      const err = error as { status?: number; response?: { data?: { _message?: string } }; message?: string };
      if (err.status === 429) {
        setError("Too many requests, please try again later");
      } else {
        setError(
          err.response?.data?._message ||
            err.message ||
            "Something went wrong"
        );
      }
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
      className={`fixed bottom-4 right-4 z-[1500] w-80 bg-white rounded-xl shadow-2xl border border-amber-100 overflow-hidden transition-all duration-300 ease-out ${
        isClosing ? "animate-phone-modal-out" : "animate-phone-modal-in"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500">
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
        <p className="text-xs text-gray-500 mb-3">
          Add your phone number to receive order updates and offers.
        </p>

        <div className="flex gap-2">
          <div className="flex items-center px-3 bg-gray-100 rounded-lg text-sm text-gray-600 border border-gray-200">
            +91
          </div>
          <Input
            type="tel"
            value={phone}
            onChange={handlePhoneChange}
            placeholder="Enter phone number"
            className="flex-1 text-sm"
            maxLength={10}
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
            className="flex-1 text-xs bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
          </Button>
        </div>
      </div>

      <style jsx>{`
        @keyframes phone-modal-in {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes phone-modal-out {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(100%);
          }
        }

        .animate-phone-modal-in {
          animation: phone-modal-in 0.3s ease-out forwards;
        }

        .animate-phone-modal-out {
          animation: phone-modal-out 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
