"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Check, Eye, EyeClosed, Lock } from "lucide-react";
import { Label } from "@/components/ui/label";

const CIRCLE_RADIUS = 7;
const CIRCLE_LENGTH = 2 * Math.PI * CIRCLE_RADIUS;

const NUMBER_REGEX = /\d/;
const UPPERCASE_REGEX = /[A-Z]/;
const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

const validations = [
  { text: "At least 8 characters", check: (v: string) => v.length >= 8 },
  { text: "Contains a number", check: (v: string) => NUMBER_REGEX.test(v) },
  { text: "Contains uppercase letter", check: (v: string) => UPPERCASE_REGEX.test(v) },
  { text: "Contains special character", check: (v: string) => SPECIAL_CHAR_REGEX.test(v) },
];

function getStrokeColorClass(p: number) {
  if (p <= 0) return "stroke-transparent";
  if (p <= 0.35) return "stroke-red-500";
  if (p <= 0.7) return "stroke-brand-500";
  return "stroke-amber-400";
}

function AnimatedCheckmarkCircle({ progress }: { progress: number }) {
  const isComplete = progress >= 1;

  return (
    <div className="relative flex items-center justify-center w-5 h-5 select-none">
      <svg width="20" height="20" className="-rotate-90">
        <circle
          cx="10" cy="10" r={CIRCLE_RADIUS}
          className="stroke-muted-foreground/20" strokeWidth="1.5" fill="transparent"
        />
        <motion.circle
          cx="10" cy="10" r={CIRCLE_RADIUS}
          className={getStrokeColorClass(progress)}
          strokeWidth="1.5" fill="transparent"
          strokeDasharray={CIRCLE_LENGTH}
          initial={{ strokeDashoffset: CIRCLE_LENGTH }}
          animate={{ strokeDashoffset: CIRCLE_LENGTH - progress * CIRCLE_LENGTH }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
        />
        <motion.circle
          cx="10" cy="10" r={CIRCLE_RADIUS}
          className="fill-amber-400"
          style={{ originX: "10px", originY: "10px" }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: isComplete ? 1 : 0, opacity: isComplete ? 1 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: isComplete ? 0.15 : 0 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: isComplete ? 1 : 0, opacity: isComplete ? 1 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 15, delay: isComplete ? 0.28 : 0 }}
        >
          <Check className="text-background size-3" strokeWidth={3} />
        </motion.div>
      </div>
    </div>
  );
}

export default function StrongPasswordInput({
  value,
  onChange,
  error,
  id = "password",
}: {
  value: string;
  onChange: (val: string) => void;
  error?: string;
  id?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);

  const satisfiedCount = validations.filter((v) => v.check(value)).length;
  const passwordProgress = satisfiedCount / validations.length;

  return (
    <div>
      <Label htmlFor={id} className="block text-muted-foreground mb-2 font-medium text-sm">
        Password
      </Label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Lock size={18} className="text-foreground z-10" />
        </div>
        <input
          type={showPassword ? "text" : "password"}
          id={id}
          name={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="********"
          className="w-full pl-10 pr-12 py-3 bg-background/70 backdrop-blur-sm border border-border rounded-xl focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md"
          required
          aria-required="true"
          aria-describedby="password-description"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-muted-foreground hover:text-muted-foreground transition-colors cursor-pointer"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeClosed size={18} /> : <Eye size={18} />}
          </button>
          {value.length > 0 && <AnimatedCheckmarkCircle progress={passwordProgress} />}
        </div>
      </div>
      <span id="password-description" className="sr-only">Enter a secure password</span>
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
      {value.length > 0 && (
        <div className="space-y-1.5 mt-3">
          {validations.map((validation, index) => {
            const isValid = validation.check(value);
            return (
              <div
                key={index}
                className={`flex items-center gap-2 text-sm transition-colors duration-200 ${
                  isValid ? "text-amber-500 font-medium" : "text-muted-foreground"
                }`}
              >
                <div className="flex items-center justify-center w-3.5 h-3.5">
                  {isValid ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center justify-center w-3 h-3 rounded-full bg-amber-500 text-background"
                    >
                      <Check className="size-2.5 shrink-0" strokeWidth={3} />
                    </motion.div>
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/15" />
                  )}
                </div>
                <span>{validation.text}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
