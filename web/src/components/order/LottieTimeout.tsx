"use client";

import { useEffect, useRef } from "react";

interface LottieTimeoutProps {
  ms: number;
  onTimeout: () => void;
}

export default function LottieTimeout({ ms, onTimeout }: LottieTimeoutProps) {
  const fired = useRef(false);
  useEffect(() => {
    const t = setTimeout(() => {
      if (!fired.current) {
        fired.current = true;
        onTimeout();
      }
    }, ms);
    return () => clearTimeout(t);
  }, [ms, onTimeout]);
  return null;
}
