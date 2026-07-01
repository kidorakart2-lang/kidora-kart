"use client";
import React from "react";
import { Sparkles, Users, Award, Package, MapPin, Heart } from "lucide-react";
import { siteConfig, getFullAddress } from "@/lib/utils";

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
      title: `${siteConfig.name} Born`,
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
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto">
        <div className="liquid-glass rounded-[3rem] p-8 sm:p-12 mb-8 shimmer">
          <div className="text-center mb-12 relative z-10">
            <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-4 tracking-tight">
              {siteConfig.name} Story
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From friendship to craftsmanship - A journey of passion,
              dedication, and sparkling dreams
            </p>
          </div>

          {/* Introduction */}
          <div className="liquid-card rounded-3xl p-6 sm:p-8 mb-8 relative z-10">
            <div className="flex items-start gap-4">
              <Heart className="w-8 h-8 text-muted-foreground flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-3">
                  Our Story
                </h2>
                <p className="text-muted-foreground leading-relaxed">
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
                      <Icon className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="px-3 py-1 bg-background/80 text-muted-foreground rounded-full text-sm font-semibold shadow-sm border border-border/50">
                          {milestone.year}
                        </span>
                        <h3 className="text-xl font-bold text-foreground">
                          {milestone.title}
                        </h3>
                      </div>
                      <p className="text-muted-foreground">{milestone.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expertise Section */}
          <div className="grid sm:grid-cols-3 gap-4 mb-8 relative z-10">
            <div className="liquid-card rounded-2xl p-6 text-center hover:scale-105 transition-transform duration-300">
              <div className="text-3xl font-bold text-foreground mb-2">10+</div>
              <div className="text-muted-foreground font-medium">Years Experience</div>
            </div>
            <div className="liquid-card rounded-2xl p-6 text-center hover:scale-105 transition-transform duration-300">
              <div className="text-3xl font-bold text-foreground mb-2">100%</div>
              <div className="text-muted-foreground font-medium">Customization</div>
            </div>
            <div className="liquid-card rounded-2xl p-6 text-center hover:scale-105 transition-transform duration-300">
              <div className="text-3xl font-bold text-foreground mb-2">
                All India
              </div>
              <div className="text-muted-foreground font-medium">Delivery</div>
            </div>
          </div>

          {/* What We Do */}
          <div className="liquid-card rounded-3xl p-6 sm:p-8 mb-8 relative z-10">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              What Sets Us Apart
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-muted-foreground rounded-full mt-2"></div>
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    Retail Excellence:
                  </span>{" "}
                  Curated collections for every occasion
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-muted-foreground rounded-full mt-2"></div>
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    Manufacturing:
                  </span>{" "}
                  In-house craftsmanship and quality control
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-muted-foreground rounded-full mt-2"></div>
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    Customization:
                  </span>{" "}
                  Bringing your unique vision to life
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-muted-foreground rounded-full mt-2"></div>
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">
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
              <MapPin className="w-6 h-6 text-muted-foreground" />
              <h3 className="text-xl font-semibold text-foreground">Visit Us</h3>
            </div>
            <p className="text-muted-foreground mb-2">
               <span className="font-semibold">{siteConfig.name}</span>
            </p>
            <p className="text-muted-foreground">{getFullAddress()}</p>
            <p className="text-muted-foreground text-sm mt-3">
              From our roots in Bhati Circle, Ratanada to serving customers
              across India - we're here to make your special moments sparkle.
            </p>
          </div>
        </div>

        {/* Footer Message */}
        <div className="text-center liquid-card rounded-3xl p-6">
          <p className="text-muted-foreground italic">
            "Built on friendship, driven by passion, and crafted with love -
            {siteConfig.name} is more than a business, it's our dream brought to
            life."
          </p>
        </div>
      </div>
    </div>
  );
}
