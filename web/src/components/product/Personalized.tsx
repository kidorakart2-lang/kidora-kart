"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Sparkles, Check, AlertCircle, Type, Heart } from "lucide-react";
import { usePathname } from "next/navigation";

export default function PremiumPersonalized() {
  const [personalizedName, setPersonalizedName] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [charCount, setCharCount] = useState(0);

  const maxLength = 25;

  useEffect(() => {
    if (personalizedName !== null && personalizedName?.length > 0) {
      sessionStorage.setItem("personalizedName", personalizedName);
      setCharCount(personalizedName?.length);
    }

    // Validation: Check for special characters
    const hasSpecialChars = /[^a-zA-Z0-9\s,.'&-]/.test(personalizedName);
    setIsValid(!hasSpecialChars);
  }, [personalizedName]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setPersonalizedName(value);
      if (value.length > 0) {
        setShowPreview(true);
      }
    }
  };

  const clearText = () => {
    setPersonalizedName("");
    setShowPreview(false);
  };

  const suggestions = [
    "Love Always",
    "Forever Yours",
    "Est. 2024",
    "Cherished",
  ];

  useEffect(() => {
    const savedName = sessionStorage.getItem("personalizedName");
    if (savedName !== null && savedName?.length > 0) {
      setPersonalizedName(savedName);
      setShowPreview(true);
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="mt-8"
    >
      {/* Main Card */}
      <div className="bg-white/60 backdrop-blur-xl  border border-white/80 shadow-lg overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/50 p-6 md:p-8 border-b border-amber-100/50">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center flex-shrink-0"
              >
                <Gift className="w-6 h-6 text-amber-600" strokeWidth={1.5} />
              </motion.div>
              <div>
                <h3 className="text-2xl font-light text-gray-900 tracking-tight mb-2">
                  Make It Personal
                </h3>
                <p className="text-sm text-gray-600 font-light leading-relaxed max-w-xl">
                  Add a heartfelt message to create a truly unique keepsake.
                  Each personalization is carefully hand-engraved by our master
                  artisans.
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/60 backdrop-blur-sm rounded-full border border-amber-200/50">
              <Sparkles size={14} className="text-amber-600" />
              <span className="text-xs text-gray-600 font-light">
                Premium Service
              </span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Text Input */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-900 uppercase tracking-wider">
              Your Message
            </label>
            <div className="relative">
              <div className="relative">
                <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  id="personalizedName"
                  maxLength={maxLength}
                  value={personalizedName}
                  onChange={handleInputChange}
                  placeholder="Enter your personalization text..."
                  className={`w-full pl-12 pr-20 py-4 border-2 rounded-2xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-white font-light text-gray-900 ${
                    !isValid ? "border-red-300" : "border-gray-200"
                  }`}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {personalizedName && (
                    <motion.button
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      onClick={clearText}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </motion.button>
                  )}
                  <span
                    className={`text-xs font-light ${
                      charCount >= maxLength ? "text-red-500" : "text-gray-400"
                    }`}
                  >
                    {charCount}/{maxLength}
                  </span>
                </div>
              </div>

              {/* Validation Message */}
              <AnimatePresence>
                {!isValid && personalizedName && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 mt-2 text-red-600 text-sm"
                  >
                    <AlertCircle size={14} />
                    <span className="font-light">
                      Please use only letters, numbers, and basic punctuation
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Suggestions */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-gray-500 font-light mr-2 self-center">
                Suggestions:
              </span>
              {suggestions.map((suggestion) => (
                <motion.button
                  key={suggestion}
                  onClick={() => setPersonalizedName(suggestion)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-full text-xs text-gray-700 font-light transition-colors"
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Live Preview */}
          <AnimatePresence>
            {showPreview && personalizedName && isValid && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-6 bg-gradient-to-br from-gray-50 to-amber-50/30 rounded-2xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={16} className="text-amber-600" />
                    <span className="text-sm font-medium text-gray-900 uppercase tracking-wider">
                      Preview
                    </span>
                  </div>
                  <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-2xl md:text-3xl text-gray-900"
                    >
                      {personalizedName}
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Important Notes */}
          <div className="flex items-start gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900">
                Important Information
              </p>
              <ul className="text-xs text-blue-700 font-light space-y-1 list-disc list-inside">
                <li>
                  Personalization is hand-engraved and cannot be changed after
                  ordering
                </li>
                <li>
                  Please allow 3-5 additional business days for personalized
                  items
                </li>
                <li>Personalized items are final sale and non-returnable</li>
              </ul>
            </div>
          </div>

          {/* Success Indicator */}
          <AnimatePresence>
            {personalizedName && isValid && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center justify-center gap-2 p-3 bg-green-50 rounded-2xl border border-green-200"
              >
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-700 font-light">
                  Your personalization has been saved
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
