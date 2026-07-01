"use client";

import { useState, useRef, useEffect } from "react";

interface HoldToConfirmButtonProps {
  onConfirm: () => void;
  duration?: number;
  label?: string;
  confirmLabel?: string;
  className?: string;
  loading?: boolean;
}

export function HoldToConfirmButton({
  onConfirm,
  duration = 2000,
  label = "Hold to Confirm",
  confirmLabel = "Confirmed!",
  className = "",
  loading,
}: HoldToConfirmButtonProps) {
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const handleMouseDown = () => {
    setIsHolding(true);
    startTimeRef.current = Date.now();

    const animate = () => {
      if (!startTimeRef.current) return;

      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / duration) * 100, 100);

      setProgress(newProgress);

      if (newProgress >= 100) {
        setIsConfirmed(true);
        onConfirm();
        setIsHolding(false);

        // Reset after 1.5 seconds
        timeoutRef.current = setTimeout(() => {
          setIsConfirmed(false);
          setProgress(0);
        }, 1500);
      } else {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const handleMouseUp = () => {
    setIsHolding(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (!isConfirmed) {
      setProgress(0);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <button
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      disabled={isConfirmed || loading}
      className={`relative w-full py-3.5 px-6 rounded-xl font-semibold text-white transition-all overflow-hidden ${
        isConfirmed
          ? "bg-gradient-to-r from-brand-700 to-brand-700 shadow-lg cursor-default"
          : "bg-gradient-to-r from-brand-600 to-brand-600 hover:from-brand-700 hover:to-brand-700 shadow-md hover:shadow-lg"
      } ${className}`}
    >
      <div
        className="absolute inset-0 rounded-xl transition-all duration-75 ease-out"
        style={{
          background: `linear-gradient(90deg, color-mix(in srgb, var(--brand-600) 50%, transparent) 0%, color-mix(in srgb, var(--brand-600) 30%, transparent) ${progress}%, transparent ${progress}%, transparent 100%)`,
          opacity: isHolding ? 1 : 0,
        }}
      />

      {/* Animated border glow */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none transition-all duration-300"
        style={{
          boxShadow: isHolding
            ? `inset 0 0 20px color-mix(in srgb, var(--brand-600) 40%, transparent), 0 0 20px color-mix(in srgb, var(--brand-600) 30%, transparent)`
            : "none",
        }}
      />

      {/* Content */}
      <div className="relative flex items-center justify-center gap-2">
        {isConfirmed ? (
          <>
            <svg
              className="w-5 h-5 animate-pulse"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>{confirmLabel}</span>
          </>
        ) : (
          <>
            <div className="flex flex-col">
              <span>
                {label}{" "}
                {isHolding && (
                  <span className="text-sm opacity-75">
                    {Math.round(progress)}%
                  </span>
                )}
              </span>

              <div className="block text-[12px] w-fit mx-auto text-center">
                Hold TO Confirm
              </div>
            </div>
          </>
        )}
      </div>

      {/* Animated particles on hold */}
      {isHolding && (
        <>
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-background rounded-full pointer-events-none"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${1 + i * 0.2}s ease-in-out infinite`,
                opacity: 0.6,
              }}
            />
          ))}
        </>
      )}

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0;
          }
          50% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(-20px)
              translateX(${Math.random() * 20 - 10}px);
            opacity: 0;
          }
        }
      `}</style>
    </button>
  );
}
