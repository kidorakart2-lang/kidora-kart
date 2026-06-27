"use client";

import Link from "next/link";
import { motion } from "framer-motion";
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
      {/* Background Image with Parallax Effect */}
      <motion.div
        className="absolute inset-0 bg-center bg-cover"
        style={{
          backgroundImage: image
            ? `url('${image}')`
            : "url('/images/poster.webp')",
        }}
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />

      {/* Elegant Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent"></div>

      {/* Animated Decorative Elements */}
      <motion.div
        className="absolute top-20 right-20 w-32 h-32 border border-white/20 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <motion.div
        className="absolute bottom-32 right-40 w-20 h-20 border border-white/10 rounded-full"
        animate={{
          scale: [1, 1.3, 1],
          rotate: [360, 180, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Floating Sparkles */}
      <motion.div
        className="absolute top-1/4 right-1/3"
        animate={{
          y: [0, -20, 0],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Sparkles className="w-6 h-6 text-white/40" />
      </motion.div>
      <motion.div
        className="absolute top-1/3 right-1/4"
        animate={{
          y: [0, -15, 0],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      >
        <Sparkles className="w-4 h-4 text-white/50" />
      </motion.div>

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            className="max-w-2xl text-white"
            initial={{ opacity: 0, x: -80 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            {/* Decorative Line */}
            <motion.div
              className="flex items-center gap-3 mb-6"
              initial={{ width: 0, opacity: 0 }}
              whileInView={{ width: "auto", opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <div className="w-12 h-[2px] bg-gradient-to-r from-amber-400 to-amber-600"></div>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </motion.div>

            {/* Heading with Staggered Animation */}
            <motion.h2
              className="text-3xl md:text-5xl lg:text-6xl font-serif mb-6 leading-[1.2]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <span className="block">New Trending</span>
              <span className="block bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 bg-clip-text text-transparent font-bold">
                Collection
              </span>
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              className="text-base md:text-lg lg:text-xl mb-8 text-gray-200 font-light max-w-lg leading-relaxed"
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
                className="group inline-flex items-center gap-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium py-4 px-8 rounded-full transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/40 relative overflow-hidden"
              >
                <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-500"></span>
                <span className="relative z-10 text-base tracking-wide">
                  Shop Now
                </span>
                <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />

                {/* Animated Ring */}
                <span className="absolute inset-0 rounded-full ring-2 ring-white/0 group-hover:ring-white/50 transition-all duration-500 group-hover:scale-110"></span>
              </Link>
            </motion.div>

            {/* Bottom Accent Line */}
            <motion.div
              className="flex items-center gap-2 mt-8"
              initial={{ width: 0, opacity: 0 }}
              whileInView={{ width: "200px", opacity: 1 }}
              transition={{ duration: 1, delay: 1 }}
              viewport={{ once: true }}
            >
              <div className="h-[1px] flex-1 bg-gradient-to-r from-amber-400/60 to-transparent"></div>
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
