'use client';

import dynamic from 'next/dynamic';
import { type LightfallProps } from '@/components/Lightfall';

const Lightfall = dynamic(
  () => import('@/components/Lightfall'),
  { ssr: false }
);

interface LightfallBackgroundProps extends Omit<LightfallProps, 'className'> {
  children?: React.ReactNode;
  className?: string;
}

export default function LightfallBackground({
  children,
  className,
  ...props
}: LightfallBackgroundProps) {
  return (
    <div className={`relative ${className ?? ''}`}>
      <div className="absolute inset-0 z-0">
        <Lightfall
          speed={0.4}
          density={0.4}
          glow={1.2}
          opacity={0.5}
          {...props}
        />
      </div>
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  );
}
