"use client";

import { CSSProperties, useEffect, useRef, useState } from "react";
import { Check, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SwipeButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  onSwipeComplete?: () => void;
  text?: string;
  className?: string;
  gap?: number;
  validationDuration?: number;
}

export function SwipeButton({
  onSwipeComplete,
  text = "Swipe to validate",
  className,
  gap = 4,
  validationDuration = 2000,
  ...props
}: SwipeButtonProps) {
  const [isSwiped, setIsSwiped] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isValidated) {
      const timer = setTimeout(() => {
        setIsValidated(false);
        setIsSwiped(false);
        setCurrentX(0);
        setIsDragging(false);
      }, validationDuration);
      return () => clearTimeout(timer);
    }
  }, [isValidated, validationDuration]);

  const handleStart = (clientX: number) => {
    if (isValidated) return;
    setStartX(clientX);
    setIsDragging(true);
  };

  const handleMove = (clientX: number) => {
    if (!buttonRef.current || !isDragging || isValidated) return;

    const containerWidth = containerRef.current?.offsetWidth || 0;
    const buttonWidth = buttonRef.current.offsetWidth;
    const maxSwipe = containerWidth - buttonWidth - gap * 2;

    let newX = clientX - startX;
    newX = Math.max(0, Math.min(newX, maxSwipe));

    setCurrentX(newX);
    setIsSwiped(newX >= maxSwipe - 10);
  };

  const handleEnd = () => {
    if (isValidated) return;

    if (isSwiped) {
      setIsValidated(true);
      setCurrentX(0);
      onSwipeComplete?.();
    } else {
      setCurrentX(0);
      setIsSwiped(false);
    }
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-12 w-[250px] touch-none select-none overflow-hidden rounded-full",
        "border border-[var(--brand-gold)]/40 bg-[var(--brand-section-bg)]",
        "transition-colors duration-200",
        className,
      )}
      onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      onTouchEnd={handleEnd}
      onMouseDown={(e) => handleStart(e.clientX)}
      onMouseMove={(e) => handleMove(e.clientX)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      role="button"
      aria-label="Swipe to validate"
      {...props}
    >
      <div className="flex h-full w-full items-center justify-center">
        <span
          style={{ "--swipe-button-text-width": "130px" } as CSSProperties}
          className="pointer-events-none select-none text-[10px] uppercase tracking-[0.18em] text-[var(--brand-plum)]/55"
        >
          {text}
        </span>
      </div>

      <button
        ref={buttonRef}
        className={cn(
          "absolute flex items-center justify-center rounded-full",
          "bg-[var(--brand-plum)] text-[var(--brand-gold)]",
          "shadow-[0_8px_18px_-10px_rgba(74,37,66,0.65)]",
          "transition-all duration-300",
          "cursor-grab active:cursor-grabbing",
          "focus-visible:ring-2 focus-visible:ring-[var(--brand-gold)] focus-visible:ring-offset-2 focus-visible:outline-none",
          "disabled:pointer-events-none",
          isValidated &&
            "w-[calc(100%-8px)] cursor-default bg-[var(--brand-gold)] text-[var(--brand-plum)]",
        )}
        style={{
          width: isValidated ? `calc(100% - ${gap * 2}px)` : "40px",
          height: `calc(100% - ${gap * 2}px)`,
          left: `${gap}px`,
          top: `${gap}px`,
          transform: isValidated ? "none" : `translateX(${currentX}px)`,
          transition: isDragging ? "none" : "all 0.3s ease",
        }}
        aria-label={isValidated ? "Validated" : "Swipe to validate"}
        disabled={isValidated}
      >
        {isValidated ? (
          <Check className="h-5 w-5" aria-hidden="true" />
        ) : (
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
