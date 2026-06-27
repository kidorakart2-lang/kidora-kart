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

export default function About() {
  const founders = [
    { name: "Himanshu Prajapat" },
    { name: "Arjun Goyal" },
    { name: "Kuldeep Deora" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <style jsx>{`
        .liquid-glass {
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.9),
            rgba(255, 255, 255, 0.7)
          );
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.8);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.9);
        }

        .liquid-card {
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.95),
            rgba(255, 255, 255, 0.85)
          );
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.9);
          box-shadow: 0 4px 24px 0 rgba(31, 38, 135, 0.1),
            inset 0 1px 0 0 rgba(255, 255, 255, 1);
        }

        .shimmer {
          position: relative;
          overflow: hidden;
        }

        .shimmer::before {
          content: "";
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            transparent 30%,
            rgba(255, 255, 255, 0.8) 50%,
            transparent 70%
          );
          animation: shimmer 3s infinite;
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%) translateY(-100%) rotate(45deg);
          }
          100% {
            transform: translateX(100%) translateY(100%) rotate(45deg);
          }
        }

        .glass-icon {
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 1),
            rgba(240, 240, 255, 0.9)
          );
          box-shadow: 0 4px 16px rgba(31, 38, 135, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 1);
        }
      `}</style>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-10">
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
                  <Heart className="w-6 h-6 text-gray-700" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    Our Story
                  </h3>
                  <p className="text-sm text-gray-600">
                    From friendship to craftsmanship
                  </p>
                </div>
              </div>
              <div className="text-gray-400 group-hover:translate-x-2 transition-transform duration-300">
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
                  <Sparkles className="w-8 h-8 text-gray-700" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-800">About Us</h1>
                  <div className="w-20 h-1 bg-gradient-to-r from-gray-600 to-gray-400 rounded-full mt-2"></div>
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed mb-6">
                Started in 2024 by three friends –{" "}
                <span className="font-semibold text-gray-800">
                  Himanshu Prajapat
                </span>
                ,{" "}
                <span className="font-semibold text-gray-800">Arjun Goyal</span>
                , and{" "}
                <span className="font-semibold text-gray-800">
                  Kuldeep Deora
                </span>{" "}
                – Jewellery Wala is your trusted destination for gold and silver
                jewellery in Jodhpur.
              </p>

              <p className="text-gray-700 leading-relaxed">
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
                  <Phone className="w-5 h-5 text-gray-700" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  WhatsApp Orders
                </h3>
                <p className="text-sm text-gray-600">
                  Easy ordering via WhatsApp chat
                </p>
              </div>

              <div className="liquid-card rounded-2xl p-6 hover:scale-105 transition-all duration-300">
                <div className="w-10 h-10 glass-icon rounded-xl flex items-center justify-center mb-3">
                  <Video className="w-5 h-5 text-gray-700" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  Video Call Preview
                </h3>
                <p className="text-sm text-gray-600">
                  See before you buy via video call
                </p>
              </div>

              <div className="liquid-card rounded-2xl p-6 hover:scale-105 transition-all duration-300">
                <div className="w-10 h-10 glass-icon rounded-xl flex items-center justify-center mb-3">
                  <Award className="w-5 h-5 text-gray-700" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  Gold & Silver
                </h3>
                <p className="text-sm text-gray-600">
                  Authentic precious metals
                </p>
              </div>

              <div className="liquid-card rounded-2xl p-6 hover:scale-105 transition-all duration-300">
                <div className="w-10 h-10 glass-icon rounded-xl flex items-center justify-center mb-3">
                  <Sparkles className="w-5 h-5 text-gray-700" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  Custom Designs
                </h3>
                <p className="text-sm text-gray-600">
                  Personalized to perfection
                </p>
              </div>
            </div>

            {/* Founders Section */}
            <div className="liquid-card rounded-3xl p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-gray-700" />
                Founded By
              </h3>
              <div className="flex flex-wrap gap-3">
                {founders.map((founder, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 bg-white/80 rounded-full text-gray-700 font-medium text-sm border border-gray-200/50 shadow-sm"
                  >
                    {founder.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Location with Map */}
            <div className="liquid-card rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-6 h-6 text-gray-700" />
                <h3 className="text-xl font-semibold text-gray-800">
                  Visit Our Store
                </h3>
              </div>
              <p className="text-gray-700 mb-2 font-semibold">Jewellery Wala</p>
              <p className="text-gray-600 mb-4">
                Jhalamand Circle, Jodhpur, Rajasthan
              </p>

              {/* Google Map */}
              <div className="liquid-card rounded-2xl overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3579.0519319886844!2d73.03910947406595!3d26.22750208920371!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39418b779b15f17f%3A0xdd3cdd6bd6778a08!2sJEWELLERY%20WALA!5e0!3m2!1sen!2sin!4v1762241579048!5m2!1sen!2sin"
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
                <ShoppingBag className="w-6 h-6 text-gray-700 group-hover:scale-110 transition-transform duration-300" />
                <span className="text-xl font-semibold text-gray-800">
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
