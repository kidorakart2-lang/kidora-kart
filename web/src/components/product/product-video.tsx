"use client";

import { Play, X, Maximize2, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useCallback, useRef, useEffect } from "react";

type VideoType = "youtube" | "vimeo" | "direct" | null;

function detectVideoType(url: string): VideoType {
  if (!url) return null;
  if (/youtube\.com|youtu\.be|youtube\.fr/i.test(url)) return "youtube";
  if (/vimeo\.com|vimeo\.fr/i.test(url)) return "vimeo";
  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)) return "direct";
  return null;
}

function getYouTubeEmbedUrl(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0`;
  }
  return null;
}

function getVimeoEmbedUrl(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  if (match?.[1]) return `https://player.vimeo.com/video/${match[1]}?autoplay=1`;
  return null;
}

export default function ProductVideoPlayer({
  videoUrl,
  onClose,
  isActive,
}: {
  videoUrl: string;
  onClose?: () => void;
  isActive?: boolean;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoType = detectVideoType(videoUrl);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      try {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch {
        // Fullscreen not supported
      }
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const renderVideo = () => {
    if (!loaded) {
      return (
        <button
          onClick={() => {
            setLoaded(true);
            setIsLoading(true);
          }}
          className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-brand-100/60 to-brand-200/60 cursor-pointer group transition-colors"
          aria-label="Play video"
        >
          {/* Pulsing rings */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-brand-400/60 animate-ping" />
            <div className="absolute inset-2 rounded-full border-2 border-brand-400/40" />
            <div className="relative z-10 w-16 h-16 md:w-20 md:h-20 rounded-full bg-brand-600/90 text-white flex items-center justify-center shadow-xl group-hover:bg-brand-700 group-hover:scale-110 transition-all duration-300">
              <Play className="w-7 h-7 md:w-8 md:h-8 fill-current ml-0.5" />
            </div>
          </div>
          <span className="mt-4 text-sm font-medium text-brand-800">
            Click to play video
          </span>
        </button>
      );
    }

    // Loading spinner between clicking play and video actually loading
    if (isLoading) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-brand-100/60 to-brand-200/60">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 md:w-14 md:h-14 rounded-full border-4 border-brand-200 border-t-brand-600"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 text-sm font-medium text-brand-800"
          >
            Loading video...
          </motion.p>
        </div>
      );
    }

    switch (videoType) {
      case "youtube": {
        const embedUrl = getYouTubeEmbedUrl(videoUrl);
        if (!embedUrl) return renderFallback();
        return (
          <iframe
            src={embedUrl}
            onLoad={() => setIsLoading(false)}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Product Video"
          />
        );
      }
      case "vimeo": {
        const embedUrl = getVimeoEmbedUrl(videoUrl);
        if (!embedUrl) return renderFallback();
        return (
          <iframe
            src={embedUrl}
            onLoad={() => setIsLoading(false)}
            className="absolute inset-0 w-full h-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title="Product Video"
          />
        );
      }
      case "direct":
        return (
          <video
            src={videoUrl}
            onCanPlay={() => setIsLoading(false)}
            className="absolute inset-0 w-full h-full"
            controls
            autoPlay
            playsInline
          />
        );
      default:
        return renderFallback();
    }
  };

  const renderFallback = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted gap-3">
      <Play className="w-12 h-12 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Video unavailable</p>
      {onClose && (
        <button
          onClick={onClose}
          className="text-xs text-brand-600 underline hover:text-brand-700"
        >
          View images instead
        </button>
      )}
    </div>
  );

  // Reset loaded state when a new video is selected
  useEffect(() => {
    setLoaded(false);
    setIsLoading(false);
  }, [videoUrl]);

  // Reset loaded state when video closes
  const handleClose = useCallback(() => {
    setLoaded(false);
    setIsLoading(false);
    onClose?.();
  }, [onClose]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={isActive ? "video" : "placeholder"}
        ref={containerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className={`relative bg-black/5 overflow-hidden ${
          isFullscreen ? "bg-black" : ""
        } h-96 sm:h-[500px] border border-brand-100/50`}
      >
        {renderVideo()}

        {/* Close button — only show when not on the play overlay */}
        {onClose && loaded && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleClose}
            className="absolute top-4 right-4 z-20 bg-background/90 hover:bg-background text-foreground p-2.5 rounded-full shadow-lg backdrop-blur-md transition-all"
            aria-label="View images"
          >
            <X className="w-5 h-5" />
          </motion.button>
        )}

        {/* Fullscreen toggle — only show when video is loaded */}
        {loaded && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleFullscreen}
            className="absolute top-4 left-4 z-20 bg-background/90 hover:bg-background text-foreground p-2.5 rounded-full shadow-lg backdrop-blur-md transition-all"
            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </motion.button>
        )}

        {/* Video indicator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-4 bg-black/40 text-background px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-md flex items-center gap-1.5"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          {isLoading ? "Loading..." : loaded ? "Playing" : "Video"}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


