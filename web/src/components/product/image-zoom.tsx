"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { X } from "lucide-react";

export default function ImageZoom({ src, alt, isMobile }: { src: string; alt: string; isMobile: boolean }) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || isMobile) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    if (!isMobile) setIsZoomed(false);
  };

  // if (isMobile) {
  //   return (
  //     <div
  //       ref={containerRef}
  //       className="relative w-full h-full cursor-zoom-in "
  //       onClick={() => setIsZoomed(true)}
  //     >
  //       <Image
  //         src={src || "/placeholder.svg"}
  //         alt={alt}
  //         fill
  //         className="object-cover"
  //         priority
  //       />
  //       <motion.div
  //         initial={{ opacity: 0 }}
  //         animate={{ opacity: 1 }}
  //         className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity"
  //         onClick={() => setIsZoomed(false)}
  //       >
  //         <ZoomIn className="w-8 h-8 text-white" />
  //       </motion.div>

  //       <AnimatePresence>
  //         {isZoomed && (
  //           <motion.div
  //             initial={{ opacity: 0 }}
  //             animate={{ opacity: 1 }}
  //             exit={{ opacity: 0 }}
  //             className="fixed top-0 w-screen h-screen inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
  //             onClick={() => setIsZoomed(false)}
  //           >
  //             <motion.div
  //               initial={{ scale: 0.8 }}
  //               animate={{ scale: 1 }}
  //               exit={{ scale: 0.8 }}
  //               className="fixed top-0 w-full h-full max-w-2xl max-h-[100vh] z-[10000]"
  //               onClick={(e) => e.stopPropagation()}
  //             >
  //               <Image
  //                 src={src || "/placeholder.svg"}
  //                 alt={alt}
  //                 fill
  //                 className="object-contain rounded-2xl"
  //                 priority
  //                 sizes="(max-width: 768px) 100vw, 80vw"
  //                 onClick={() => setIsZoomed(false)}
  //               />
  //               <motion.button
  //                 whileHover={{ scale: 1.1 }}
  //                 whileTap={{ scale: 0.9 }}
  //                 onClick={() => setIsZoomed(false)}
  //                 className="fixed top-6 right-4 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-md transition-colors z-[10000]"
  //                 aria-label="Close zoom"
  //               >
  //                 <X className="w-6 h-6" />
  //               </motion.button>
  //             </motion.div>
  //           </motion.div>
  //         )}
  //       </AnimatePresence>
  //     </div>
  //   );
  // }

  // Desktop lens zoom
  // no change here //

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden cursor-none"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsZoomed(true)}
      onMouseLeave={handleMouseLeave}
    >
      <Image
        src={src || "/placeholder.svg"}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover"
        priority
      />

      {isZoomed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute w-32 h-32 border-2 border-brand-400 rounded-full pointer-events-none shadow-lg z-[1000]"
          style={{
            left: `${mousePos.x}%`,
            top: `${mousePos.y}%`,
            transform: "translate(-50%, -50%)",
            backgroundImage: `url(${src})`,
            backgroundPosition: `${mousePos.x}% ${mousePos.y}%`,
            backgroundSize: "800%",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-200/20 to-transparent" />
        </motion.div>
      )}
    </div>
  );
}
