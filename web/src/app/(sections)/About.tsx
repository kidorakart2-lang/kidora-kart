"use client";
import React from "react";
import {
  Sparkles,
  Users,
  Award,
  MapPin,
  Heart,
  ShoppingBag,
  Phone,
  Video,
} from "lucide-react";
import Link from "next/link";
import { siteConfig, getFullAddress } from "@/lib/utils";

export default function About() {
  const founders = [
    { name: "Himanshu Prajapat" },
    { name: "Arjun Goyal" },
    { name: "Kuldeep Deora" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Side - Images */}
          <div className="space-y-6">
            {/* Main Large Image */}
            <div className="liquid-card rounded-3xl overflow-hidden shimmer">
              <img
                src="noimage.jpg"
                alt="Traditional Indian Jewellery Woman"
                className="w-full h-96 object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Secondary Large Image */}
            <div className="liquid-card rounded-3xl overflow-hidden shimmer">
              <img
                src="noimage.jpg"
                alt="Elegant Jewellery Display"
                className="w-full h-80 object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Our Story Button */}
            <Link
              href="/story"
              className="liquid-glass rounded-2xl p-6 flex items-center justify-between group hover:scale-[1.02] transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 glass-icon rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Heart className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">
                    Our Story
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    From friendship to craftsmanship
                  </p>
                </div>
              </div>
              <div className="text-muted-foreground group-hover:translate-x-2 transition-transform duration-300">
                →
              </div>
            </Link>
          </div>

          {/* Right Side - About Content */}
          <div className="space-y-6">
            {/* Header */}
            <div className="liquid-glass rounded-3xl p-8 shimmer relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 glass-icon rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-foreground">About Us</h1>
                  <div className="w-20 h-1 bg-gradient-to-r from-gray-600 to-gray-400 rounded-full mt-2"></div>
                </div>
              </div>

              <p className="text-muted-foreground leading-relaxed mb-6">
                Started in 2024 by three friends –{" "}
                <span className="font-semibold text-foreground">
                  Himanshu Prajapat
                </span>
                ,{" "}
                <span className="font-semibold text-foreground">Arjun Goyal</span>
                , and{" "}
                <span className="font-semibold text-foreground">
                  Kuldeep Deora
                </span>{" "}
                – {siteConfig.name} is your trusted destination for gold and silver
                jewellery in {siteConfig.address.city}.
              </p>

              <p className="text-muted-foreground leading-relaxed">
                Located at Jhalamand Circle, Jodhpur, we bring you exquisite
                craftsmanship and authentic jewellery. What sets us apart is our
                commitment to transparency and customer satisfaction – you can
                order conveniently via WhatsApp chat, and for added peace of
                mind, we offer video call viewing before you place your order.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="liquid-card rounded-2xl p-6 hover:scale-105 transition-all duration-300">
                <div className="w-10 h-10 glass-icon rounded-xl flex items-center justify-center mb-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  WhatsApp Orders
                </h3>
                <p className="text-sm text-muted-foreground">
                  Easy ordering via WhatsApp chat
                </p>
              </div>

              <div className="liquid-card rounded-2xl p-6 hover:scale-105 transition-all duration-300">
                <div className="w-10 h-10 glass-icon rounded-xl flex items-center justify-center mb-3">
                  <Video className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  Video Call Preview
                </h3>
                <p className="text-sm text-muted-foreground">
                  See before you buy via video call
                </p>
              </div>

              <div className="liquid-card rounded-2xl p-6 hover:scale-105 transition-all duration-300">
                <div className="w-10 h-10 glass-icon rounded-xl flex items-center justify-center mb-3">
                  <Award className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  Gold & Silver
                </h3>
                <p className="text-sm text-muted-foreground">
                  Authentic precious metals
                </p>
              </div>

              <div className="liquid-card rounded-2xl p-6 hover:scale-105 transition-all duration-300">
                <div className="w-10 h-10 glass-icon rounded-xl flex items-center justify-center mb-3">
                  <Sparkles className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  Custom Designs
                </h3>
                <p className="text-sm text-muted-foreground">
                  Personalized to perfection
                </p>
              </div>
            </div>

            {/* Founders Section */}
            <div className="liquid-card rounded-3xl p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-muted-foreground" />
                Founded By
              </h3>
              <div className="flex flex-wrap gap-3">
                {founders.map((founder, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 bg-background/80 rounded-full text-muted-foreground font-medium text-sm border border-border/50 shadow-sm"
                  >
                    {founder.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Location with Map */}
            <div className="liquid-card rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-6 h-6 text-muted-foreground" />
                <h3 className="text-xl font-semibold text-foreground">
                  Visit Our Store
                </h3>
              </div>
               <p className="text-muted-foreground mb-2 font-semibold">{siteConfig.name}</p>
              <p className="text-muted-foreground mb-4">
                {getFullAddress()}
              </p>

              {/* Google Map */}
              <div className="liquid-card rounded-2xl overflow-hidden">
                <iframe
                  src={siteConfig.address.googleMapsEmbedUrl}
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="rounded-2xl"
                ></iframe>
              </div>
            </div>

            {/* Continue Shopping Button */}
            <Link href={"/"}>
              <button className="w-full liquid-glass rounded-2xl p-6 flex items-center justify-center gap-3 group hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                <ShoppingBag className="w-6 h-6 text-muted-foreground group-hover:scale-110 transition-transform duration-300" />
                <span className="text-xl font-semibold text-foreground">
                  Continue Shopping
                </span>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
