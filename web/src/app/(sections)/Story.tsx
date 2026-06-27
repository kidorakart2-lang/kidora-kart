"use client";
import React from "react";
import { Sparkles, Users, Award, Package, MapPin, Heart } from "lucide-react";

export default function Story() {
  const milestones = [
    {
      year: "College Days",
      title: "The Beginning",
      description:
        "Three friends with a shared vision started their entrepreneurial journey with an online shoes business through WhatsApp.",
      icon: Users,
    },
    {
      year: "2023",
      title: "Men's Wear Venture",
      description:
        "Established a menswear clothing business at Main Bhati Circle, Ratanada, Jodhpur, honing our skills in marketing and sales.",
      icon: Package,
    },
    {
      year: "Present",
      title: "Jewellery Walla Born",
      description:
        "With 10 years of jewellery expertise, we opened our store in Jhalamand, combining retail, manufacturing, and customization.",
      icon: Sparkles,
    },
    {
      year: "Now",
      title: "All India Presence",
      description:
        "Expanded our reach online, delivering exquisite jewellery across India while maintaining our commitment to quality and customization.",
      icon: Award,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4 sm:p-8">
      <style jsx>{`
        @keyframes liquid {
          0%,
          100% {
            border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
          }
          50% {
            border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
          }
        }

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

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto">
        <div className="liquid-glass rounded-[3rem] p-8 sm:p-12 mb-8 shimmer">
          <div className="text-center mb-12 relative z-10">
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-800 mb-4 tracking-tight">
              Jewellery Walla Story
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From friendship to craftsmanship - A journey of passion,
              dedication, and sparkling dreams
            </p>
          </div>

          {/* Introduction */}
          <div className="liquid-card rounded-3xl p-6 sm:p-8 mb-8 relative z-10">
            <div className="flex items-start gap-4">
              <Heart className="w-8 h-8 text-gray-700 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                  Our Story
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  What began as three friends with big dreams in college has
                  blossomed into a trusted name in the jewellery industry. Our
                  journey started with humble beginnings - selling shoes online
                  through WhatsApp, where we learned the art of customer service
                  and building relationships. This foundation taught us
                  invaluable lessons about entrepreneurship and the power of
                  perseverance.
                </p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-6 mb-8 relative z-10">
            {milestones.map((milestone, index) => {
              const Icon = milestone.icon;
              return (
                <div
                  key={index}
                  className="liquid-card rounded-3xl p-6 hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 glass-icon rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-6 h-6 text-gray-700" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="px-3 py-1 bg-white/80 text-gray-700 rounded-full text-sm font-semibold shadow-sm border border-gray-200/50">
                          {milestone.year}
                        </span>
                        <h3 className="text-xl font-bold text-gray-800">
                          {milestone.title}
                        </h3>
                      </div>
                      <p className="text-gray-600">{milestone.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expertise Section */}
          <div className="grid sm:grid-cols-3 gap-4 mb-8 relative z-10">
            <div className="liquid-card rounded-2xl p-6 text-center hover:scale-105 transition-transform duration-300">
              <div className="text-3xl font-bold text-gray-800 mb-2">10+</div>
              <div className="text-gray-600 font-medium">Years Experience</div>
            </div>
            <div className="liquid-card rounded-2xl p-6 text-center hover:scale-105 transition-transform duration-300">
              <div className="text-3xl font-bold text-gray-800 mb-2">100%</div>
              <div className="text-gray-600 font-medium">Customization</div>
            </div>
            <div className="liquid-card rounded-2xl p-6 text-center hover:scale-105 transition-transform duration-300">
              <div className="text-3xl font-bold text-gray-800 mb-2">
                All India
              </div>
              <div className="text-gray-600 font-medium">Delivery</div>
            </div>
          </div>

          {/* What We Do */}
          <div className="liquid-card rounded-3xl p-6 sm:p-8 mb-8 relative z-10">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              What Sets Us Apart
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-gray-600 rounded-full mt-2"></div>
                <p className="text-gray-600">
                  <span className="font-semibold text-gray-800">
                    Retail Excellence:
                  </span>{" "}
                  Curated collections for every occasion
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-gray-600 rounded-full mt-2"></div>
                <p className="text-gray-600">
                  <span className="font-semibold text-gray-800">
                    Manufacturing:
                  </span>{" "}
                  In-house craftsmanship and quality control
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-gray-600 rounded-full mt-2"></div>
                <p className="text-gray-600">
                  <span className="font-semibold text-gray-800">
                    Customization:
                  </span>{" "}
                  Bringing your unique vision to life
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-gray-600 rounded-full mt-2"></div>
                <p className="text-gray-600">
                  <span className="font-semibold text-gray-800">
                    Pan-India Delivery:
                  </span>{" "}
                  Your jewelry, anywhere in India
                </p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="liquid-card rounded-3xl p-6 relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <MapPin className="w-6 h-6 text-gray-700" />
              <h3 className="text-xl font-semibold text-gray-800">Visit Us</h3>
            </div>
            <p className="text-gray-700 mb-2">
              <span className="font-semibold">Jewellery Walla</span>
            </p>
            <p className="text-gray-600">Jhalamand, Jodhpur, Rajasthan</p>
            <p className="text-gray-500 text-sm mt-3">
              From our roots in Bhati Circle, Ratanada to serving customers
              across India - we're here to make your special moments sparkle.
            </p>
          </div>
        </div>

        {/* Footer Message */}
        <div className="text-center liquid-card rounded-3xl p-6">
          <p className="text-gray-600 italic">
            "Built on friendship, driven by passion, and crafted with love -
            Jewellery Walla is more than a business, it's our dream brought to
            life."
          </p>
        </div>
      </div>
    </div>
  );
}
