"use client";
import { useState, useRef, useEffect } from "react";
import {
  User,
  Camera,
  MapPin,
  Upload,
  X,
  Package,
  Shield,
} from "lucide-react";
import { Tabs } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import SettingsSection from "./SettingsSection";
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
import { useRouter, useSearchParams } from "next/navigation";

import { getAuthToken } from "@/lib/cookies";
import { toast } from "sonner";
import Image from "next/image";
import MyOrders from "./MyOrder";

import LoadingOverlay from "@/components/comman/LoadingOverlay";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store/store";
import { setProfile } from "@/redux/features/auth";
import { useUserProfile } from "@/lib/useProfile";
import { useQueryClient } from "@tanstack/react-query";
import { userKeys } from "@/lib/useProfile";
import { INDIAN_STATES } from "@/lib/utils";

const tabs = [
  { id: "account", label: "Account", icon: User, desc: "Manage your profile, address & preferences" },
  { id: "orders", label: "Orders", icon: Package, desc: "Track orders, returns & purchase history" },
  { id: "settings", label: "Settings", icon: Shield, desc: "Password, security & account preferences" },
];

export default function AccountPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const queryClient = useQueryClient();

  const data = useSelector((state: RootState) => state.auth.details);

  const [avatar, setAvatar] = useState(data?.avatar ?? null);
  const [activeTab, setActiveTab] = useState("account");
  const [direction, setDirection] = useState(1);
  const [formData, setFormData] = useState({
    name: data?.name || "",
    email: data?.email || "",
    gender: data?.gender || "",
    mobile: data?.mobile || "",
    street: data?.address?.street || "",
    area: data?.address?.area || "",
    city: data?.address?.city || "",
    state: data?.address?.state || "",
    pincode: data?.address?.pincode || "",
    instructions: data?.address?.instructions || "",
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null!);
  const imageUploadRef = useRef<HTMLDivElement>(null!);

  // React Query — fetch user profile with caching + dedup
  const { data: profileData, isLoading } = useUserProfile();

  // Sync profile to Redux and populate form once data arrives
  useEffect(() => {
    if (!profileData) return;
    dispatch(setProfile(profileData));
    setFormData({
      name: profileData.name || "",
      email: profileData.email || "",
      gender: profileData.gender || "",
      mobile: profileData.mobile || "",
      street: profileData.address?.street || "",
      area: profileData.address?.area || "",
      city: profileData.address?.city || "",
      state: profileData.address?.state || "",
      pincode: profileData.address?.pincode || "",
      instructions: profileData.address?.instructions || "",
    });
    setAvatar(profileData.avatar ?? null);
  }, [profileData, dispatch]);

  // Redirect to login if not authenticated and no cached data
  useEffect(() => {
    if (!isLoading && !profileData && !getAuthToken()) {
      router.push("/login?returnTo=/profile");
    }
  }, [isLoading, profileData, router]);

  const params = useSearchParams();

  useEffect(() => {
    const tab = params.get("tab");
    // Always land on a real tab — an absent/unknown ?tab= must never leave the
    // profile screen with nothing selected.
    setActiveTab(tabs.some((item) => item.id === tab) ? (tab as string) : "account");
  }, [params]);

  const handleTabChange = (value: string) => {
    const prevIdx = tabs.findIndex((t) => t.id === activeTab);
    const nextIdx = tabs.findIndex((t) => t.id === value);
    setDirection(nextIdx > prevIdx ? 1 : -1);
    setActiveTab(value);
  };

  const scrollToImageUpload = () => {
    if (activeTab !== "account") {
      setActiveTab("account");
      setTimeout(() => {
        imageUploadRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    } else {
      imageUploadRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePreviewImage = () => {
    setPreviewImage(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = getAuthToken();

    const formDataToSend = new FormData();

    if (selectedFile) {
      formDataToSend.append("avatar", selectedFile);
    }

    if (formData.name !== data?.name) {
      formDataToSend.append("name", formData.name);
    }
    if (formData.mobile !== data?.mobile) {
      formDataToSend.append("mobile", formData.mobile);
    }
    if (formData.gender && formData.gender !== data?.gender) {
      formDataToSend.append("gender", formData.gender);
    }
    if (formData.street !== data?.address?.street) {
      formDataToSend.append("street", formData.street);
    }
    if (formData.area !== data?.address?.area) {
      formDataToSend.append("area", formData.area);
    }
    if (formData.city !== data?.address?.city) {
      formDataToSend.append("city", formData.city);
    }
    if (formData.state !== data?.address?.state) {
      formDataToSend.append("state", formData.state);
    }
    if (formData.pincode !== data?.address?.pincode) {
      formDataToSend.append("pincode", formData.pincode);
    }
    if (formData.instructions !== data?.address?.instructions) {
      formDataToSend.append("instructions", formData.instructions);
    }

    try {
      const response = await fetch("/api/website/user/update-profile", {
          method: "PUT",
          body: formDataToSend,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 429) {
        toast.error("Too many requests, please try again later");
        return;
      }

      const res = await response.json();
      if (res._status) {
        toast.success(res._message);
        setPreviewImage(null);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        queryClient.invalidateQueries({ queryKey: userKeys.profile() });
      } else {
        toast.error(res._message);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err?.response?.data?.message || err?.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const variants = {
    enter: (dir: number) => ({ y: dir > 0 ? -40 : 40, opacity: 0 }),
    center: { y: 0, opacity: 1 },
    exit: (dir: number) => ({ y: dir > 0 ? 40 : -40, opacity: 0 }),
  };

  const transition = { type: "spring" as const, stiffness: 320, damping: 30 };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <LoadingOverlay hidden={false} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">
        {/* Profile Header */}
        <div className="mb-6 flex flex-col items-start gap-6 rounded-xl border border-[var(--brand-gold)]/25 bg-white p-6 md:flex-row md:items-center md:p-8">
          <div className="group relative shrink-0">
            <div className="size-20 overflow-hidden rounded-full border border-[var(--brand-gold)]/50 bg-[var(--brand-cream)] p-1 md:size-24">
              <Avatar className="w-full h-full">
                {avatar && (
                  <Image
                    src={avatar}
                    alt="Profile"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                )}
                <AvatarFallback className="bg-[var(--brand-cream)] text-[13px] text-[var(--brand-mauve)]">
                  {data?.name?.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <button
              onClick={scrollToImageUpload}
              className="absolute -bottom-0.5 -right-0.5 rounded-full border border-[var(--brand-gold)]/40 bg-[var(--brand-plum)] p-2 text-[var(--brand-cream)] transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <Camera size={14} />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <p className="eyebrow mb-1.5 text-[10px]">
              <span className="mr-1.5">✦</span>
              Member profile
            </p>
            <h1 className="display-heading truncate text-2xl md:text-3xl">
              {data?.name || "My Account"}
            </h1>
            <p className="mt-0.5 text-[12.5px] text-[var(--brand-ink)]/65">{data?.email}</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar Nav */}
            <div className="w-full md:w-56 shrink-0">
              <div className="flex flex-wrap md:flex-col gap-1.5 bg-transparent w-full h-auto p-0 rounded-none justify-start border-none">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={cn(
                        "relative flex w-full shrink-0 cursor-pointer select-none items-center justify-start gap-3 whitespace-nowrap rounded-full px-4 py-3 text-[10.5px] uppercase tracking-[0.14em] transition-all outline-none",
                        "hover:bg-white",
                        isActive
                          ? "text-[var(--brand-cream)]"
                          : "border border-transparent text-[var(--brand-ink)]/70 hover:border-[var(--brand-gold)]/30"
                      )}
                    >
                      <Icon className="w-4 h-4 z-10 shrink-0" />
                      <span className="z-10 text-left">{tab.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="profile-tab-indicator"
                          className="pointer-events-none absolute inset-0 rounded-full bg-[var(--brand-plum)]"
                          initial={false}
                          transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content Panel */}
            <div className="flex-1 w-full relative min-h-[400px]">
              <AnimatePresence mode="wait" custom={direction}>
                {tabs.map((tab) => {
                  if (tab.id !== activeTab) return null;
                  return (
                    <motion.div
                      key={tab.id}
                      custom={direction}
                      variants={variants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={transition}
                    >
                      {/* Account Tab */}
                      {tab.id === "account" && (
                        <form
                          id="account"
                          onSubmit={handleSubmit}
                          className="space-y-8 rounded-xl border border-[var(--brand-gold)]/25 bg-white p-6 sm:p-8"
                        >
                          {/* Image Upload Section */}
                          <div ref={imageUploadRef}>
                            <h2 className="display-heading mb-4 flex items-center gap-2 text-lg">
                              <Camera size={16} className="text-[var(--brand-gold-dark)]" strokeWidth={1.6} />
                              Profile Picture
                            </h2>

                            <div className="flex flex-col md:flex-row gap-6 items-start">
                              <div className="flex size-32 items-center justify-center overflow-hidden rounded-full border border-dashed border-[var(--brand-gold)]/50 bg-[var(--brand-cream)]/60">
                                {previewImage ? (
                                  <div className="relative w-full h-full group">
                                    <img
                                      src={previewImage}
                                      alt="Preview"
                                      className="w-full h-full object-cover"
                                    />
                                    <button
                                      onClick={removePreviewImage}
                                      className="absolute top-1 right-1 bg-destructive hover:bg-destructive/90 text-background p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                ) : (
                                  <Upload size={26} className="text-[var(--brand-gold)]/70" strokeWidth={1.4} />
                                )}
                              </div>

                              <div className="flex-1">
                                <Input
                                  ref={fileInputRef}
                                  type="file"
                                  accept="image/*"
                                  onChange={handleImageChange}
                                  className="hidden"
                                  id="avatar-upload"
                                />
                                <Label
                                  htmlFor="avatar-upload"
                                  className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[var(--brand-gold)]/45 px-4 py-2 text-[10.5px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/70 transition-all duration-300 hover:bg-[var(--brand-cream)]"
                                >
                                  <Upload size={16} />
                                  Choose Image
                                </Label>
                                <p className="mt-2 text-[11px] text-[var(--brand-ink)]/65">
                                  JPG, PNG or GIF. Max size 5MB.
                                </p>

                                {previewImage && (
                                  <div className="flex gap-2 mt-4">
                                    <button
                                      onClick={removePreviewImage}
                                      className="rounded-full border border-[var(--brand-gold)]/30 px-4 py-2 text-[10.5px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/70 transition-all duration-300 hover:bg-[var(--brand-cream)]"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Personal Information */}
                          <div>
                            <h2 className="display-heading mb-5 text-lg">
                              Personal Information
                            </h2>

                            <div className="space-y-4">
                              <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="block text-[10.5px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/65">
                                    Full Name
                                  </Label>
                                  <Input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        name: e.target.value,
                                      })
                                    }
                                    className="w-full rounded-lg border border-[var(--brand-gold)]/30 bg-white px-4 py-2.5 text-sm text-[var(--brand-ink)] transition-all duration-300 focus:border-[var(--brand-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)]/30"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="block text-[10.5px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/65">
                                    Gender
                                  </Label>
                                  <Select
                                    value={formData.gender}
                                    onValueChange={(value) =>
                                      setFormData({ ...formData, gender: value })
                                    }
                                  >
                                    <SelectTrigger className="w-full rounded-lg border-[var(--brand-gold)]/30 bg-white text-[var(--brand-ink)]">
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
                                  <Label className="block text-[10.5px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/65">
                                    Email Address
                                  </Label>
                                  <p className="text-sm text-[var(--brand-ink)]/75">{data?.email}</p>
                                </div>
                                <div className="space-y-2">
                                  <Label className="block text-[10.5px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/65">
                                    Phone Number
                                  </Label>
                                  <Input
                                    type="text"
                                    name="phone"
                                    value={formData.mobile}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        mobile: e.target.value,
                                      })
                                    }
                                    placeholder="Enter phone number"
                                    className="w-full rounded-lg border border-[var(--brand-gold)]/30 bg-white px-4 py-2.5 text-sm text-[var(--brand-ink)] transition-all duration-300 focus:border-[var(--brand-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)]/30"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Shipping Address */}
                          <div>
                            <h3 className="display-heading mb-5 flex items-center gap-2 text-lg">
                              <MapPin size={16} className="text-[var(--brand-gold-dark)]" strokeWidth={1.6} />
                              Shipping Address
                            </h3>

                            <div className="space-y-4">
                              <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="block text-[10.5px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/65">
                                    Street Address
                                  </Label>
                                  <Input
                                    type="text"
                                    name="street"
                                    value={formData.street}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        street: e.target.value,
                                      })
                                    }
                                    placeholder="Enter street address"
                                    className="w-full rounded-lg border border-[var(--brand-gold)]/30 bg-white px-4 py-2.5 text-sm text-[var(--brand-ink)] transition-all duration-300 focus:border-[var(--brand-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)]/30"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="block text-[10.5px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/65">
                                    Area
                                  </Label>
                                  <Input
                                    type="text"
                                    name="area"
                                    value={formData.area}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        area: e.target.value,
                                      })
                                    }
                                    placeholder="Enter area/locality"
                                    className="w-full rounded-lg border border-[var(--brand-gold)]/30 bg-white px-4 py-2.5 text-sm text-[var(--brand-ink)] transition-all duration-300 focus:border-[var(--brand-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)]/30"
                                  />
                                </div>
                              </div>

                              <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="block text-[10.5px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/65">
                                    City
                                  </Label>
                                  <Input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        city: e.target.value,
                                      })
                                    }
                                    placeholder="Enter city"
                                    className="w-full rounded-lg border border-[var(--brand-gold)]/30 bg-white px-4 py-2.5 text-sm text-[var(--brand-ink)] transition-all duration-300 focus:border-[var(--brand-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)]/30"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="block text-[10.5px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/65">
                                    State
                                  </Label>
                                  <Select
                                    value={formData.state}
                                    onValueChange={(value) => {
                                      setFormData({
                                        ...formData,
                                        state: value,
                                      });
                                    }}
                                    name="state"
                                    required
                                  >
                                    <SelectTrigger className="w-full rounded-lg border-[var(--brand-gold)]/30 bg-white text-[var(--brand-ink)]">
                                      <SelectValue placeholder="Select State" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {INDIAN_STATES.map((s) => (
                                        <SelectItem
                                          key={s}
                                          value={s}
                                          className="cursor-pointer border-b border-[var(--brand-gold)]/15"
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
                                  <Label className="block text-[10.5px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/65">
                                    Pincode
                                  </Label>
                                  <Input
                                    type="text"
                                    name="pincode"
                                    value={formData.pincode}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        pincode: e.target.value,
                                      })
                                    }
                                    placeholder="Enter pincode"
                                    className="w-full rounded-lg border border-[var(--brand-gold)]/30 bg-white px-4 py-2.5 text-sm text-[var(--brand-ink)] transition-all duration-300 focus:border-[var(--brand-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)]/30"
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label className="block text-[10.5px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/65">
                                  Delivery Instructions (Optional)
                                </Label>
                                <Textarea
                                  name="instructions"
                                  value={formData.instructions}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      instructions: e.target.value,
                                    })
                                  }
                                  placeholder="Add any special delivery instructions"
                                  rows={3}
                                  className="w-full resize-none rounded-lg border border-[var(--brand-gold)]/30 bg-white px-4 py-2.5 text-sm text-[var(--brand-ink)] transition-all duration-300 focus:border-[var(--brand-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)]/30"
                                />
                              </div>
                            </div>

                            <div className="flex gap-3 border-t border-[var(--brand-gold)]/20 pt-6">
                              <Button disabled={isSubmitting} className="btn-gold px-7 py-3 !text-[10.5px] uppercase tracking-[0.18em] disabled:opacity-60">
                                {isSubmitting ? "Saving..." : "Save Changes"}
                              </Button>
                            </div>
                          </div>
                        </form>
                      )}

                      {/* Orders Tab */}
                      {tab.id === "orders" && <MyOrders />}

                      {/* Settings Tab */}
                      {tab.id === "settings" && (
                        <div id="settings" className="rounded-xl border border-[var(--brand-gold)]/25 bg-white p-6 sm:p-8">
                          <p className="eyebrow mb-1.5 text-[10px]"><span className="mr-1.5">✦</span>Account</p>
                          <h2 className="display-heading mb-6 text-xl">
                            Account Settings
                          </h2>
                          <SettingsSection data={data} />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
