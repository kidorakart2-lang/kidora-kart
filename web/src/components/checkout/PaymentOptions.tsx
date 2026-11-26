"use client";

import { Button } from "@/components/ui/button";
import { SwipeButton } from "@/components/ui/swipe-button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Shield, RotateCcw, Truck } from "lucide-react";

interface PaymentOptionsProps {
  onPayOnline: () => void;
  onCashOnDelivery: () => void;
  loading: boolean;
}

const TRUST = [
  { icon: Shield, label: "Secure Payment" },
  { icon: RotateCcw, label: "Easy Returns" },
  { icon: Truck, label: "Fast Shipping" },
];

export default function PaymentOptions({ onPayOnline, onCashOnDelivery, loading }: PaymentOptionsProps) {
  return (
    <div className="mt-6 space-y-4 border-t border-[var(--brand-gold)]/20 pt-5">
      <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--brand-ink)]/45">
        Payment method
      </p>

      <div className="space-y-2">
        <SwipeButton onSwipeComplete={onPayOnline} text="Pay Online" className="w-full" />
        <p className="flex items-center justify-center gap-1 text-[10px] text-[var(--brand-ink)]/45">
          <Shield size={10} /> Secured by Razorpay
        </p>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[var(--brand-gold)]/20" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em]">
          <span className="bg-white px-3 text-[var(--brand-ink)]/40">or</span>
        </div>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button className="w-full rounded-full border border-[var(--brand-gold)]/45 bg-transparent px-6 py-5 text-[11px] uppercase tracking-[0.18em] text-[var(--brand-ink)]/80 transition-all hover:bg-[var(--brand-cream)]" variant="outline">
            Cash on Delivery
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="border-[var(--brand-gold)]/30 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="display-heading text-xl">Confirm Cash on Delivery</AlertDialogTitle>
            <AlertDialogDescription>You&apos;ll pay when your order arrives. Please ensure your shipping address is correct.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[var(--brand-gold)]/30 text-[var(--brand-ink)] hover:bg-[var(--brand-cream)]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onCashOnDelivery} disabled={loading} className="bg-[var(--brand-plum)] text-[var(--brand-cream)] hover:bg-[var(--brand-primary-dark)]">Confirm Order</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center justify-center gap-3 pt-1">
        <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/visa.svg" alt="Visa" className="h-5 w-auto opacity-50 transition-all hover:opacity-90" loading="lazy" />
        <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/mastercard.svg" alt="Mastercard" className="h-5 w-auto opacity-50 transition-all hover:opacity-90" loading="lazy" />
        <svg viewBox="0 0 60 36" className="h-5 w-auto opacity-50 transition-all hover:opacity-90" aria-label="RuPay" role="img"><rect width="60" height="36" rx="6" fill="#094183" /><text x="30" y="23" textAnchor="middle" fill="white" fontSize="12" fontFamily="Arial, sans-serif" fontWeight="bold">RuPay</text></svg>
        <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/googlepay.svg" alt="Google Pay" className="h-5 w-auto opacity-50 transition-all hover:opacity-90" loading="lazy" />
        <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/phonepe.svg" alt="PhonePe" className="h-5 w-auto opacity-50 transition-all hover:opacity-90" loading="lazy" />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-[var(--brand-gold)]/20 pt-4">
        {TRUST.map(({ icon: Icon, label }) => (
          <div key={label} className="text-center">
            <Icon size={16} className="mx-auto mb-1.5 text-[var(--brand-gold-dark)]" strokeWidth={1.5} />
            <p className="text-[9.5px] uppercase leading-tight tracking-[0.1em] text-[var(--brand-ink)]/50">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
