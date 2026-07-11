"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";

const FullVideoSection = () => {
  const [image, setImage] = useState("");

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const res = await fetch(
          process.env.NEXT_PUBLIC_API_URL + "api/website/banner"
        );
        const data = await res.json();
        setImage(data?.[4]?.image);
      } catch (error) {
      }
    };
    fetchBanner();
  }, []);

  return (
    <div className="relative w-full h-[65vh] lg:h-[75vh] overflow-hidden">
      {/* Background Image — lazy loaded */}
      <motion.img
        src={image || "/images/poster.webp"}
        alt="Hero background"
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent"></div>

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="max-w-2xl text-background"
            initial={{ opacity: 0, x: -80 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            {/* Decorative Line */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-[2px] bg-background/60"></div>
            </div>

            {/* Heading */}
            <motion.h2
              className="text-3xl md:text-5xl lg:text-6xl fw-heading mb-6 leading-[1.2]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <span className="block">New Trending</span>
              <span className="block text-background/90 font-semibold">
                Collection
              </span>
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              className="text-base md:text-lg lg:text-xl mb-8 text-muted-foreground fw-body max-w-lg leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              viewport={{ once: true }}
            >
              We Believe that Good Design is Always in Season
            </motion.p>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              viewport={{ once: true }}
            >
              <Link
                href="/category/new-arrivals"
                className="group inline-flex items-center gap-3 btn-gradient font-medium py-4 px-8 rounded-full transition-all duration-500 overflow-hidden"
              >
                <span className="relative z-10 text-base tracking-wide">
                  Shop Now
                </span>
                <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white/40 via-white/20 to-transparent"></div>
    </div>
  );
};

export default FullVideoSection;
