"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INDIAN_STATES, siteConfig } from "@/lib/utils";
import { MapPin, Loader2, Truck } from "lucide-react";
import type { CheckoutFormData } from "@/types";

interface ShippingAddressFormProps {
  orderData: CheckoutFormData;
  setOrderData: (data: CheckoutFormData | ((prev: CheckoutFormData) => CheckoutFormData)) => void;
  showAddressPrompt: boolean;
  setShowAddressPrompt: (v: boolean) => void;
  loadProfileAddress: () => void;
  shippingEstimate?: { estimatedCharge: number; courierName?: string; etd?: string } | null;
  isFetching: boolean;
  onCheckPincode: () => void;
  geolocationSupported?: boolean;
  detectingLocation?: boolean;
  locationFilled?: boolean;
  onDetectLocation?: () => void;
  isLoggedIn?: boolean;
  onEmailClick?: () => void;
}

export default function ShippingAddressForm({
  orderData, setOrderData, showAddressPrompt, setShowAddressPrompt,
  loadProfileAddress, shippingEstimate, isFetching, onCheckPincode,
  geolocationSupported = false, detectingLocation = false, locationFilled = false,
  onDetectLocation, isLoggedIn = false, onEmailClick,
}: ShippingAddressFormProps) {
  const sa = orderData.shippingAddress;
  const update = (field: string, value: string) => setOrderData((prev) => ({
    ...prev,
    shippingAddress: { ...prev.shippingAddress, [field]: value },
  }));

  return (
    <div className="rounded-xl border border-[var(--brand-gold)]/25 bg-white p-6 sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-8 place-items-center rounded-full border border-[var(--brand-gold)]/50 bg-[var(--brand-gold)]/10 text-[12px] text-[var(--brand-gold-dark)]">1</span>
          <div>
            <h2 className="display-heading text-lg">Shipping Information</h2>
            <p className="mt-0.5 text-[11px] text-[var(--brand-ink)]/50">Enter your delivery address</p>
          </div>
        </div>
        {geolocationSupported && onDetectLocation && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDetectLocation}
            disabled={detectingLocation}
            className="shrink-0 border-[var(--brand-gold)]/40 text-[var(--brand-ink)]/75 transition-all hover:bg-[var(--brand-cream)]"
          >
            {detectingLocation ? (
              <><Loader2 size={14} className="animate-spin mr-1" />Detecting...</>
            ) : (
              <><MapPin size={14} className="mr-1" />Detect Location</>
            )}
          </Button>
        )}
      </div>

      {locationFilled && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-start gap-3">
          <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <p className="text-sm text-emerald-700">
            Location detected — we've filled in your address automatically. Please review and correct if needed.
          </p>
        </div>
      )}

      {showAddressPrompt && (
        <div className="mb-6 flex flex-col items-start justify-between gap-4 rounded-lg border border-[var(--brand-gold)]/30 bg-[var(--brand-rose)]/20 p-4 sm:flex-row sm:items-center">
          <div className="text-sm text-[var(--brand-ink)]">
            <p className="font-medium">Saved address found</p>
            <p>Would you like to use the address saved in your profile?</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={() => setShowAddressPrompt(false)} className="flex-1 border-[var(--brand-gold)]/40 hover:bg-white sm:flex-none">Keep Current</Button>
            <Button size="sm" onClick={loadProfileAddress} className="flex-1 bg-[var(--brand-plum)] text-[var(--brand-cream)] hover:bg-[var(--brand-primary-dark)] sm:flex-none">Use Profile Address</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Full Name *" value={sa.fullName} onChange={(v) => update("fullName", v)} />
        {isLoggedIn ? (
          <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/55">Email *</label>
            <div className="w-full rounded-lg border border-[var(--brand-gold)]/20 bg-[var(--brand-cream)]/60 px-4 py-2.5 text-[var(--brand-ink)]">
              {sa.email || "—"}
            </div>
            <p className="text-xs text-muted-foreground">Email from your account</p>
          </div>
        ) : (
          <Field label="Email *" value={sa.email} onChange={(v) => update("email", v)} readonly onClick={onEmailClick} />
        )}
        <div className="space-y-1">
          <label className="text-[11px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/55">Phone *</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="text-muted-foreground text-sm">{siteConfig.contact.countryCode}</span>
            </div>
            <input type="tel" value={sa.phone} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); if (v.length <= 10) update("phone", v); }}
              className="w-full rounded-lg border border-[var(--brand-gold)]/30 bg-white py-2.5 pl-12 pr-4 text-[var(--brand-ink)] transition-all focus:border-[var(--brand-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)]/30" maxLength={10} required />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/55">Pincode *</label>
          <div className="flex gap-2">
            <input type="text" value={sa.pincode} onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 6); update("pincode", v); }}
              className="flex-1 rounded-lg border border-[var(--brand-gold)]/30 bg-white px-4 py-2.5 text-[var(--brand-ink)] transition-all focus:border-[var(--brand-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)]/30" maxLength={6} required placeholder="Enter 6-digit pincode" />
            <Button type="button" variant="outline" size="sm" onClick={onCheckPincode} disabled={sa.pincode.length !== 6}
              className="shrink-0 border-[var(--brand-gold)]/40 text-[var(--brand-ink)]/75 transition-all hover:bg-[var(--brand-cream)]">
              {isFetching ? <><Loader2 size={14} className="animate-spin mr-1" />Checking</> : <><MapPin size={14} className="mr-1" />Check</>}
            </Button>
          </div>
        </div>

        {/* Shipping Estimate */}
        {isFetching && !shippingEstimate ? (
          <div className="col-span-full -mt-2">
            <div className="border border-border rounded-xl p-4 animate-pulse">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5"><div className="w-4 h-4 rounded bg-muted-foreground/20" /><div className="h-4 w-28 rounded bg-muted-foreground/20" /></div>
                <div className="h-5 w-36 rounded-full bg-muted-foreground/20" />
              </div>
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border"><div className="w-3 h-3 rounded bg-muted-foreground/20" /><div className="h-3 w-40 rounded bg-muted-foreground/20" /></div>
            </div>
          </div>
        ) : shippingEstimate ? (
          <div className={`col-span-full -mt-2`}>
            <div className={`rounded-xl border border-[var(--brand-gold)]/30 bg-[var(--brand-cream)] p-4 transition-all hover:shadow-sm ${isFetching ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5"><Truck className="h-4 w-4 text-[var(--brand-gold-dark)]" /><span className="text-sm text-[var(--brand-ink)]">₹{shippingEstimate.estimatedCharge} shipping</span></div>
                {shippingEstimate.etd && <span className="rounded-full bg-white px-2.5 py-1 text-[10.5px] uppercase tracking-[0.12em] text-[var(--brand-mauve)]">Est. delivery {shippingEstimate.etd}</span>}
              </div>
              {shippingEstimate.courierName && (
                <div className="mt-2 flex items-center gap-1.5 border-t border-[var(--brand-gold)]/20 pt-2"><MapPin className="h-3 w-3 text-[var(--brand-gold-dark)]" /><span className="text-[11px] text-[var(--brand-ink)]/55">{shippingEstimate.courierName}</span></div>
              )}
            </div>
          </div>
        ) : null}

        <Field label="Street (House No, Building) *" value={sa.street} onChange={(v) => update("street", v)} />
        <Field label="Area *" value={sa.area} onChange={(v) => update("area", v)} placeholder="E.g., Near Central Park" />
        <Field label="City *" value={sa.city} onChange={(v) => update("city", v)} />
        <div className="space-y-1">
          <label className="text-[11px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/55">State *</label>
          <Select value={sa.state} onValueChange={(v) => update("state", v)} name="state" required>
            <SelectTrigger className="w-full"><SelectValue placeholder="Select State" /></SelectTrigger>
            <SelectContent>
              {INDIAN_STATES.map((state) => (<SelectItem key={state} value={state} className="cursor-pointer border-b-1 border-border">{state}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6">
        <label className="mb-2 block text-[11px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/55">Delivery Instructions (Optional)</label>
        <textarea placeholder="Any special delivery instructions?" rows={2} value={sa.instructions}
          onChange={(e) => update("instructions", e.target.value)}
          className="w-full rounded-lg border border-[var(--brand-gold)]/30 bg-white px-4 py-2.5 text-[var(--brand-ink)] transition-all focus:border-[var(--brand-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)]/30" />
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, readonly, onClick }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; readonly?: boolean; onClick?: () => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/55">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} readOnly={readonly}
        placeholder={placeholder} required onClick={onClick}
        className={`w-full rounded-lg border border-[var(--brand-gold)]/30 bg-white px-4 py-2.5 text-[var(--brand-ink)] transition-all focus:border-[var(--brand-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)]/30 ${readonly && onClick ? 'cursor-pointer bg-[var(--brand-cream)]/60' : ''}`} />
      {readonly && onClick && (
        <p className="text-xs text-muted-foreground">Click to sign in and fill email</p>
      )}
    </div>
  );
}
