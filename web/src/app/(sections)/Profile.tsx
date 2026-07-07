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

import { getAuthToken } from "@/lib/getAuthToken";
import { toast } from "sonner";
import Image from "next/image";
import MyOrders from "./MyOrder";

import { LoadingUi } from "./Cart";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSelector, useDispatch } from "react-redux";
import { getUser } from "@/lib/fetchUser";
import { RootState } from "@/redux/store/store";
import { setProfile } from "@/redux/features/auth";
import { INDIAN_STATES } from "@/lib/utils";

const tabs = [
  { id: "account", label: "Account", icon: User, desc: "Manage your profile, address & preferences" },
  { id: "orders", label: "Orders", icon: Package, desc: "Track orders, returns & purchase history" },
  { id: "settings", label: "Settings", icon: Shield, desc: "Password, security & account preferences" },
];

export default function AccountPage() {
  const dispatch = useDispatch();
  const router = useRouter();

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
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null!);
  const imageUploadRef = useRef<HTMLDivElement>(null!);

  const fetchUser = async () => {
    setLoading(true);
    const user = await getUser();
    if (!user) {
      setLoading(false);
      router.push("/login?returnTo=/profile");
      return;
    }
    dispatch(setProfile(user._data));
    setFormData({
      name: user._data.name || "",
      email: user._data.email || "",
      gender: user._data.gender || "",
      mobile: user._data.mobile || "",
      street: user._data.address?.street || "",
      area: user._data.address?.area || "",
      city: user._data.address?.city || "",
      state: user._data.address?.state || "",
      pincode: user._data.address?.pincode || "",
      instructions: user._data.address?.instructions || "",
    });
    setAvatar(user._data.avatar ?? null);
    setLoading(false);
  };

  useEffect(() => {
    if (data && data._id) {
      setLoading(false);
      return;
    }
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const params = useSearchParams();

  useEffect(() => {
    const tab = params.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
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
      setLoading(true);
      const response = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "api/website/user/update-profile",
        {
          method: "PUT",
          body: formDataToSend,
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 429) {
        toast.error("Too many requests, please try again later");
        setLoading(false);
        return;
      }

      const res = await response.json();
      if (res._status) {
        toast.success(res._message);
        fetchUser();
      } else {
        toast.error(res._message);
      }
      setLoading(false);
    } catch {
      setLoading(false);
      toast.error("Something went wrong");
    }
    setLoading(false);
  };

  const variants = {
    enter: (dir: number) => ({ y: dir > 0 ? -40 : 40, opacity: 0 }),
    center: { y: 0, opacity: 1 },
    exit: (dir: number) => ({ y: dir > 0 ? 40 : -40, opacity: 0 }),
  };

  const transition = { type: "spring" as const, stiffness: 320, damping: 30 };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingUi hidden={loading} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl w-full mx-auto px-4 md:px-6 py-6">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end gap-5 p-6 md:p-8 border-b border-border mb-6">
          <div className="relative group shrink-0">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gradient-to-br from-brand-100 to-brand-accent-100">
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
                <AvatarFallback className="bg-brand-200 text-brand-800 font-semibold text-lg">
                  {data?.name?.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <button
              onClick={scrollToImageUpload}
              className="absolute -bottom-1 -right-1 bg-brand-600 hover:bg-brand-700 text-background p-1.5 rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95"
            >
              <Camera size={14} />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">
              {data?.name || "My Account"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">{data?.email}</p>
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
                        "relative flex items-center cursor-pointer gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all outline-none w-full justify-start select-none whitespace-nowrap shrink-0",
                        "hover:bg-muted/60 hover:text-foreground",
                        isActive
                          ? "text-foreground shadow-sm"
                          : "text-muted-foreground border border-border/50"
                      )}
                    >
                      <Icon className="w-4 h-4 z-10 shrink-0" />
                      <span className="z-10 text-left">{tab.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="profile-tab-indicator"
                          className="absolute inset-0 bg-muted rounded-xl pointer-events-none"
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
                          className="space-y-6"
                        >
                          {/* Image Upload Section */}
                          <div ref={imageUploadRef}>
                            <h2 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
                              <Camera size={18} className="text-brand-600" />
                              Profile Picture
                            </h2>

                            <div className="flex flex-col md:flex-row gap-6 items-start">
                              <div className="w-32 h-32 rounded-xl overflow-hidden border-2 border-dashed border-border flex items-center justify-center">
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
                                  <Upload size={32} className="text-muted-foreground" />
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
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-border text-muted-foreground rounded-lg cursor-pointer transition-all duration-300 text-sm font-medium"
                                >
                                  <Upload size={16} />
                                  Choose Image
                                </Label>
                                <p className="text-xs text-muted-foreground mt-2">
                                  JPG, PNG or GIF. Max size 5MB.
                                </p>

                                {previewImage && (
                                  <div className="flex gap-2 mt-4">
                                    <button
                                      onClick={removePreviewImage}
                                      className="px-4 py-2 bg-border text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted-foreground/20 transition-all duration-300"
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
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        name: e.target.value,
                                      })
                                    }
                                    className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-300 bg-background/80"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="block text-sm font-medium text-muted-foreground">
                                    Gender
                                  </Label>
                                  <Select
                                    value={formData.gender}
                                    onValueChange={(value) =>
                                      setFormData({ ...formData, gender: value })
                                    }
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
                                  <p className="text-sm text-foreground">{data?.email}</p>
                                </div>
                                <div className="space-y-2">
                                  <Label className="block text-sm font-medium text-muted-foreground">
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
                                    className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-300 bg-background/80"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Shipping Address */}
                          <div>
                            <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
                              <MapPin size={18} className="text-brand-600" />
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
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        street: e.target.value,
                                      })
                                    }
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
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        area: e.target.value,
                                      })
                                    }
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
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        city: e.target.value,
                                      })
                                    }
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
                                    onValueChange={(value) => {
                                      setFormData({
                                        ...formData,
                                        state: value,
                                      });
                                    }}
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
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        pincode: e.target.value,
                                      })
                                    }
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
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      instructions: e.target.value,
                                    })
                                  }
                                  placeholder="Add any special delivery instructions"
                                  rows={3}
                                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-300 bg-background/80 resize-none"
                                />
                              </div>
                            </div>

                            <div className="pt-6 flex gap-3">
                              <Button className="bg-gradient-to-r from-brand-600 to-brand-700 text-background px-6 py-2.5 rounded-lg text-sm font-medium shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 active:scale-95">
                                Save Changes
                              </Button>
                            </div>
                          </div>
                        </form>
                      )}

                      {/* Orders Tab */}
                      {tab.id === "orders" && <MyOrders />}

                      {/* Settings Tab */}
                      {tab.id === "settings" && (
                        <div id="settings">
                          <h2 className="text-xl font-semibold mb-6 text-foreground">
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
