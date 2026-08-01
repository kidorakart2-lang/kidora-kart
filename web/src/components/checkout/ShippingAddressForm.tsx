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
    <div className="bg-background rounded-2xl p-6 sm:p-8 shadow-sm border border-brand-100 transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-7">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-brand-600 text-background flex items-center justify-center text-sm font-medium shadow-sm">1</span>
          <div>
            <h2 className="text-base font-semibold text-foreground">Shipping Information</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Enter your delivery address</p>
          </div>
        </div>
        {geolocationSupported && onDetectLocation && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDetectLocation}
            disabled={detectingLocation}
            className="shrink-0 border-brand-300 hover:bg-brand-50 hover:text-brand-700 transition-all"
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
        <div className="mb-6 p-4 bg-brand-50 border border-brand-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-sm text-brand-900">
            <p className="font-medium">Saved address found</p>
            <p>Would you like to use the address saved in your profile?</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={() => setShowAddressPrompt(false)} className="flex-1 sm:flex-none border-brand-300 hover:bg-brand-100">Keep Current</Button>
            <Button size="sm" onClick={loadProfileAddress} className="flex-1 sm:flex-none bg-brand-600 hover:bg-brand-700 text-background">Use Profile Address</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Full Name *" value={sa.fullName} onChange={(v) => update("fullName", v)} />
        {isLoggedIn ? (
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">Email *</label>
            <div className="w-full px-4 py-2.5 border border-border rounded-lg bg-muted/30 text-foreground">
              {sa.email || "—"}
            </div>
            <p className="text-xs text-muted-foreground">Email from your account</p>
          </div>
        ) : (
          <Field label="Email *" value={sa.email} onChange={(v) => update("email", v)} readonly onClick={onEmailClick} />
        )}
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Phone *</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="text-muted-foreground text-sm">{siteConfig.contact.countryCode}</span>
            </div>
            <input type="tel" value={sa.phone} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); if (v.length <= 10) update("phone", v); }}
              className="w-full pl-12 pr-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all" maxLength={10} required />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Pincode *</label>
          <div className="flex gap-2">
            <input type="text" value={sa.pincode} onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 6); update("pincode", v); }}
              className="flex-1 px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all" maxLength={6} required placeholder="Enter 6-digit pincode" />
            <Button type="button" variant="outline" size="sm" onClick={onCheckPincode} disabled={sa.pincode.length !== 6}
              className="shrink-0 border-brand-300 hover:bg-brand-50 hover:text-brand-700 transition-all">
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
            <div className={`bg-brand-50 border border-brand-200 rounded-xl p-4 transition-all hover:shadow-sm ${isFetching ? "opacity-60" : ""}`}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5"><Truck className="w-4 h-4 text-brand-600" /><span className="text-sm font-semibold text-brand-900">₹{shippingEstimate.estimatedCharge} shipping</span></div>
                {shippingEstimate.etd && <span className="text-xs text-brand-700 bg-brand-100 px-2.5 py-1 rounded-full font-medium">Est. delivery {shippingEstimate.etd}</span>}
              </div>
              {shippingEstimate.courierName && (
                <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-brand-200/60"><MapPin className="w-3 h-3 text-brand-500" /><span className="text-xs text-brand-600">{shippingEstimate.courierName}</span></div>
              )}
            </div>
          </div>
        ) : null}

        <Field label="Street (House No, Building) *" value={sa.street} onChange={(v) => update("street", v)} />
        <Field label="Area *" value={sa.area} onChange={(v) => update("area", v)} placeholder="E.g., Near Central Park" />
        <Field label="City *" value={sa.city} onChange={(v) => update("city", v)} />
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">State *</label>
          <Select value={sa.state} onValueChange={(v) => update("state", v)} name="state" required>
            <SelectTrigger className="w-full"><SelectValue placeholder="Select State" /></SelectTrigger>
            <SelectContent>
              {INDIAN_STATES.map((state) => (<SelectItem key={state} value={state} className="cursor-pointer border-b-1 border-border">{state}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium text-muted-foreground mb-2">Delivery Instructions (Optional)</label>
        <textarea placeholder="Any special delivery instructions?" rows={2} value={sa.instructions}
          onChange={(e) => update("instructions", e.target.value)}
          className="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all" />
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, readonly, onClick }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; readonly?: boolean; onClick?: () => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} readOnly={readonly}
        placeholder={placeholder} required onClick={onClick}
        className={`w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all ${readonly && onClick ? 'cursor-pointer bg-muted/50' : ''}`} />
      {readonly && onClick && (
        <p className="text-xs text-muted-foreground">Click to sign in and fill email</p>
      )}
    </div>
  );
}
