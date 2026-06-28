"use client";
import { useState, useRef, useEffect } from "react";
import {
  User,
  History,
  Settings,
  Camera,
  MapPin,
  Upload,
  X,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import axios from "axios";
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
const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];
export default function AccountPage() {
  const dispatch = useDispatch();
  const router = useRouter();

  const data = useSelector((state: RootState) => state.auth.details);

  const [avatar, setAvatar] = useState(data?.avatar ?? "");
  const [activeTab, setActiveTab] = useState("account");
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
      name: user._data.name,
      email: user._data.email,
      gender: user._data.gender,
      mobile: user._data.mobile,
      street: user._data.address.street,
      area: user._data.address.area,
      city: user._data.address.city,
      state: user._data.address.state,
      pincode: user._data.address.pincode,
      instructions: user._data.address.instructions,
    });
    setAvatar(user._data.avatar ?? "");
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
    // const paramsChange = new URLSearchParams(params.toString()); // make editable copy
    // paramsChange.set("tab", value);

    // router.replace(`?${paramsChange.toString()}`); // or router.push() if you want history
    // window.scrollTo({
    //   top: 0,
    //   behavior: "smooth",
    // });
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
      // Store the actual File object for upload
      setSelectedFile(file);

      // Create a preview URL for the image
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePreviewImage = () => {
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = getAuthToken();

    // Create FormData for file upload
    const formDataToSend = new FormData();

    // Add the avatar file if selectedFile exists
    if (selectedFile) {
      formDataToSend.append("avatar", selectedFile);
    }

    // Append other user data
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
      const response = await axios.put(
        process.env.NEXT_PUBLIC_API_URL + `api/website/user/update-profile`,
        formDataToSend,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data._status) {
        toast.success(response.data._message);
        fetchUser();
      } else {
        toast.error(response.data._message);
      }
      setLoading(false);
      // Optionally show success message to user
    } catch (err) {
      setLoading(false);
      if (err instanceof Error && "status" in err && (err as any).status === 429) {
        toast.error("Too many requests, please try again later");
      } else {
        toast.error(
          err instanceof Error
            ? (err as any).response?.data?._message || err.message
            : "Something went wrong"
        );
      }
      // Optionally show error message to user
    }
    setLoading(false);
  };
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingUi hidden={loading} />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        <div className="max-w-7xl w-full mx-auto ">
          {/* Profile Header Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden mb-6 border border-amber-100">
            <div className="px-2 md:px-8 py-2 ">
              {/* Avatar Section */}
              <div className="flex flex-col md:flex-row md:items-end md:justify-between">
                <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
                  <div className="relative group">
                    {/* Avatar container with same glow + shape */}
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-gradient-to-br from-amber-100 to-orange-100 transform transition-transform duration-300 group-hover:scale-105">
                      <Avatar className="w-full h-full">
                        <Image
                          src={avatar}
                          alt="Profile"
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                        />

                        <AvatarFallback className="bg-amber-200 text-amber-800 font-semibold text-lg">
                          {data?.name?.slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Camera Button */}
                    <button
                      onClick={scrollToImageUpload}
                      className="absolute bottom-2 right-2 bg-amber-600 hover:bg-amber-700 text-white p-2 rounded-full shadow-lg transform transition-all duration-300 hover:scale-110 active:scale-95"
                    >
                      <Camera size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="mt-6">
                <Tabs
                  value={activeTab}
                  onValueChange={handleTabChange}
                  className="w-full"
                >
                  <TabsList className="w-full md:w-auto grid grid-cols-2 md:flex h-auto md:h-10 bg-amber-50/50 p-1 rounded-xl">
                    <TabsTrigger
                      value="account"
                      className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg px-4 py-2.5 md:py-2 text-sm transition-all duration-300"
                    >
                      <User size={16} />
                      <span className=" sm:inline">Account</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="orders"
                      className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg px-4 py-2.5 md:py-2 text-sm transition-all duration-300"
                    >
                      <History size={16} />
                      <span className=" sm:inline">Orders</span>
                    </TabsTrigger>
                    {/* <TabsTrigger
                      value="wishlist"
                      className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg px-4 py-2.5 md:py-2 text-sm transition-all duration-300"
                    >
                      <Heart size={16} />
                      <span className=" sm:inline">Wishlist</span>
                    </TabsTrigger> */}
                    <TabsTrigger
                      value="settings"
                      className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg px-4 py-2.5 md:py-2 text-sm transition-all duration-300"
                    >
                      <Settings size={16} />
                      <span className=" sm:inline">Settings</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Account Tab */}
                  <TabsContent value="account" className="mt-6 animate-fade-in">
                    <form
                      id="account"
                      onSubmit={handleSubmit}
                      className="space-y-6"
                    >
                      {/* Image Upload Section */}
                      <div
                        ref={imageUploadRef}
                        className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-amber-100/50 animate-slide-up"
                      >
                        <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                          <Camera size={18} className="text-amber-600" />
                          Profile Picture
                        </h2>

                        <div className="flex flex-col md:flex-row gap-6 items-start">
                          <div className="w-32 h-32 rounded-xl overflow-hidden border-2 border-dashed border-gray-300  flex items-center justify-center">
                            {previewImage ? (
                              <div className="relative w-full h-full group">
                                <img
                                  src={previewImage}
                                  alt="Preview"
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  onClick={removePreviewImage}
                                  className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <Upload size={32} className="text-gray-400" />
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
                              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg cursor-pointer transition-all duration-300 text-sm font-medium"
                            >
                              <Upload size={16} />
                              Choose Image
                            </Label>
                            <p className="text-xs text-gray-500 mt-2">
                              JPG, PNG or GIF. Max size 5MB.
                            </p>

                            {previewImage && (
                              <div className="flex gap-2 mt-4 animate-fade-in">
                                <button
                                  onClick={removePreviewImage}
                                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-all duration-300"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Personal Information */}
                      <div
                        className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-amber-100/50 animate-slide-up"
                        style={{ animationDelay: "0.1s" }}
                      >
                        <h2 className="text-lg font-semibold mb-6 text-gray-800">
                          Personal Information
                        </h2>

                        <div className="space-y-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            {/* Name */}
                            <div className="space-y-2">
                              <Label className="block text-sm font-medium text-gray-700">
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
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300 bg-white/80"
                              />
                            </div>
                            {/* Gender */}
                            <div className="space-y-2">
                              <Label className="block text-sm font-medium text-gray-700">
                                Gender
                              </Label>
                              <Select
                                value={formData.gender}
                                onValueChange={(value) =>
                                  setFormData({ ...formData, gender: value })
                                }
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300 bg-white/80"
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue
                                    placeholder="Select Gender"
                                    className="w-full"
                                  />
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
                            {/* Email */}
                            <div className="space-y-2">
                              <Label className="block text-sm font-medium text-gray-700">
                                Email Address
                              </Label>
                              <p>{data?.email}</p>
                            </div>
                            {/* Phone */}
                            <div className="space-y-2">
                              <Label className="block text-sm font-medium text-gray-700">
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
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300 bg-white/80"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Shipping Address */}
                      <div
                        className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-amber-100/50 animate-slide-up"
                        style={{ animationDelay: "0.2s" }}
                      >
                        <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                          <MapPin size={18} className="text-amber-600" />
                          Shipping Address
                        </h3>

                        <div className="space-y-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            {/* Street */}
                            <div className="space-y-2">
                              <Label className="block text-sm font-medium text-gray-700">
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
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300 bg-white/80"
                              />
                            </div>
                            {/* Area */}
                            <div className="space-y-2">
                              <Label className="block text-sm font-medium text-gray-700">
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
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300 bg-white/80"
                              />
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            {/* City */}
                            <div className="space-y-2">
                              <Label className="block text-sm font-medium text-gray-700">
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
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300 bg-white/80"
                              />
                            </div>
                            {/* State */}
                            <div className="space-y-2">
                              <Label className="block text-sm font-medium text-gray-700">
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
                                  {INDIAN_STATES.map((state) => (
                                    <SelectItem
                                      key={state}
                                      value={state}
                                      className="cursor-pointer border-b-1 border-gray-300"
                                    >
                                      {state}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            {/* Pincode */}
                            <div className="space-y-2">
                              <Label className="block text-sm font-medium text-gray-700">
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
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300 bg-white/80"
                              />
                            </div>
                          </div>

                          {/* Instructions */}
                          <div className="space-y-2">
                            <Label className="block text-sm font-medium text-gray-700">
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
                              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300 bg-white/80 resize-none"
                            />
                          </div>
                        </div>

                        <div className="pt-6 flex gap-3">
                          <Button className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 active:scale-95">
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    </form>
                  </TabsContent>

                  {/* Orders Tab */}
                  <TabsContent value="orders" className="mt-6 animate-fade-in">
                    <MyOrders />
                  </TabsContent>

                  {/* Wishlist Tab */}
                  {/* <TabsContent
                    value="wishlist"
                    className="mt-6 animate-fade-in"
                  >
                    <Wishlist />
                  </TabsContent> */}

                  {/* Settings Tab */}
                  <TabsContent
                    value="settings"
                    className="mt-6 animate-fade-in"
                  >
                    <div
                      id="settings"
                      className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-amber-100/50"
                    >
                      <h2 className="text-xl font-semibold mb-6 text-gray-800">
                        Account Settings
                      </h2>

                      <div className="space-y-6">
                        <SettingsSection data={data} />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes slide-up {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-fade-in {
            animation: fade-in 0.4s ease-out;
          }

          .animate-slide-up {
            animation: slide-up 0.5s ease-out forwards;
            opacity: 0;
          }
        `}</style>
      </div>
    </>
  );
}
