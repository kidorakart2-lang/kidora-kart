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

export default function PaymentOptions({ onPayOnline, onCashOnDelivery, loading }: PaymentOptionsProps) {
  return (
    <div className="mt-8 space-y-4">
      <div className="space-y-2">
        <SwipeButton onSwipeComplete={onPayOnline} text="Pay Online" className="w-full" />
        <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
          <Shield size={10} /> Secured by Razorpay
        </p>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-3 text-muted-foreground">or</span></div>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button className="w-full py-5 px-6 rounded-xl fw-cta transition-all border-2 border-brand-200 hover:border-brand-400 hover:bg-brand-50/50 text-foreground" variant="outline">
            Cash on Delivery
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="border-brand-500/30 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Confirm Cash on Delivery</AlertDialogTitle>
            <AlertDialogDescription>You&apos;ll pay when your order arrives. Please ensure your shipping address is correct.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-brand-500/30 text-foreground hover:bg-brand-500/10">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onCashOnDelivery} disabled={loading} className="bg-brand-600 hover:bg-brand-700 text-background">Confirm Order</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center justify-center gap-3 pt-2">
        <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/visa.svg" alt="Visa" className="h-6 w-auto opacity-60 transition-all hover:opacity-100" loading="lazy" />
        <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/mastercard.svg" alt="Mastercard" className="h-6 w-auto opacity-60 transition-all hover:opacity-100" loading="lazy" />
        <svg viewBox="0 0 60 36" className="h-6 w-auto opacity-60 transition-all hover:opacity-100" aria-label="RuPay" role="img"><rect width="60" height="36" rx="6" fill="#094183" /><text x="30" y="23" textAnchor="middle" fill="white" fontSize="12" fontFamily="Arial, sans-serif" fontWeight="bold">RuPay</text></svg>
        <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/googlepay.svg" alt="Google Pay" className="h-6 w-auto opacity-60 transition-all hover:opacity-100" loading="lazy" />
        <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/phonepe.svg" alt="PhonePe" className="h-6 w-auto opacity-60 transition-all hover:opacity-100" loading="lazy" />
      </div>

      <div className="bg-background rounded-xl p-5 shadow-sm border border-brand-100 mt-6">
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Shield, label: "Secure Payment", color: "text-amber-600", bg: "bg-amber-100" },
            { icon: RotateCcw, label: "Easy Returns", color: "text-brand-600", bg: "bg-brand-100" },
            { icon: Truck, label: "Fast Shipping", color: "text-brand-600", bg: "bg-brand-100" },
          ].map(({ icon: Icon, label, color, bg }) => (
            <div key={label} className="text-center">
              <div className={`w-10 h-10 mx-auto ${bg} rounded-full flex items-center justify-center ${color} mb-1.5`}><Icon size={18} /></div>
              <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
