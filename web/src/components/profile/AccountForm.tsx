"use client";

import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INDIAN_STATES } from "@/lib/utils";

interface FormFields {
  name: string;
  email: string;
  gender: string;
  mobile: string;
  street: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  instructions: string;
}

interface AccountFormProps {
  formData: FormFields;
  userEmail: string;
  isSubmitting: boolean;
  onFormChange: (data: Partial<FormFields>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  children?: React.ReactNode;
}

export default function AccountForm({
  formData,
  userEmail,
  isSubmitting,
  onFormChange,
  onSubmit,
  children,
}: AccountFormProps) {
  return (
    <form id="account" onSubmit={onSubmit} className="space-y-6">
      {children}

      {/* Personal Information */}
      <div>
        <h2 className="text-lg font-semibold mb-6 text-foreground">
          Personal Information
        </h2>

        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="block text-sm font-medium text-muted-foreground">
                Full Name
              </Label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={(e) => onFormChange({ name: e.target.value })}
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-300 bg-background/80"
              />
            </div>
            <div className="space-y-2">
              <Label className="block text-sm font-medium text-muted-foreground">
                Gender
              </Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => onFormChange({ gender: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent className="w-full">
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="block text-sm font-medium text-muted-foreground">
                Email Address
              </Label>
              <p className="text-sm text-foreground">{userEmail}</p>
            </div>
            <div className="space-y-2">
              <Label className="block text-sm font-medium text-muted-foreground">
                Phone Number
              </Label>
              <Input
                type="text"
                name="phone"
                value={formData.mobile}
                onChange={(e) => onFormChange({ mobile: e.target.value })}
                placeholder="Enter phone number"
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-300 bg-background/80"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
          <MapPin size={18} className="text-muted-foreground" />
          Shipping Address
        </h3>

        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="block text-sm font-medium text-muted-foreground">
                Street Address
              </Label>
              <Input
                type="text"
                name="street"
                value={formData.street}
                onChange={(e) => onFormChange({ street: e.target.value })}
                placeholder="Enter street address"
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-300 bg-background/80"
              />
            </div>
            <div className="space-y-2">
              <Label className="block text-sm font-medium text-muted-foreground">
                Area
              </Label>
              <Input
                type="text"
                name="area"
                value={formData.area}
                onChange={(e) => onFormChange({ area: e.target.value })}
                placeholder="Enter area/locality"
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-300 bg-background/80"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="block text-sm font-medium text-muted-foreground">
                City
              </Label>
              <Input
                type="text"
                name="city"
                value={formData.city}
                onChange={(e) => onFormChange({ city: e.target.value })}
                placeholder="Enter city"
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-300 bg-background/80"
              />
            </div>
            <div className="space-y-2">
              <Label className="block text-sm font-medium text-muted-foreground">
                State
              </Label>
              <Select
                value={formData.state}
                onValueChange={(value) => onFormChange({ state: value })}
                name="state"
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  {INDIAN_STATES.map((s) => (
                    <SelectItem
                      key={s}
                      value={s}
                      className="cursor-pointer border-b-1 border-border"
                    >
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="block text-sm font-medium text-muted-foreground">
                Pincode
              </Label>
              <Input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={(e) => onFormChange({ pincode: e.target.value })}
                placeholder="Enter pincode"
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-300 bg-background/80"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="block text-sm font-medium text-muted-foreground">
              Delivery Instructions (Optional)
            </Label>
            <Textarea
              name="instructions"
              value={formData.instructions}
              onChange={(e) => onFormChange({ instructions: e.target.value })}
              placeholder="Add any special delivery instructions"
              rows={3}
              className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-300 bg-background/80 resize-none"
            />
          </div>
        </div>

        <div className="pt-6 flex gap-3">
          <Button variant="gradient" disabled={isSubmitting} className="px-6 py-2.5 rounded-lg text-sm fw-cta shadow-sm transform transition-all duration-300 hover:scale-105 active:scale-95">
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </form>
  );
}
