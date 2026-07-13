"use client";

import { Play, X, Maximize2, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useCallback, useRef } from "react";

type VideoType = "youtube" | "vimeo" | "direct" | null;

function detectVideoType(url: string): VideoType {
  if (!url) return null;
  if (/youtube\.com|youtu\.be|youtube\.fr|youtube\.nl|youtube\.de|youtube\.ca|youtube\.com\.au/i.test(url)) return "youtube";
  if (/vimeo\.com|vimeo\.fr/i.test(url)) return "vimeo";
  if (/\.(mp4|webm|ogg|mov|avi|m4v)(\?|$)/i.test(url)) return "direct";
  return null;
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

function getYouTubeEmbedUrl(url: string, autoplay = false): string | null {
  const id = extractYouTubeId(url);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}${autoplay ? "?autoplay=1&rel=0" : ""}`;
}

function getVimeoEmbedUrl(url: string, autoplay = false): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  if (match?.[1]) return `https://player.vimeo.com/video/${match[1]}${autoplay ? "?autoplay=1" : ""}`;
  return null;
}

export function VideoThumbnail({
  videoUrl,
  onClick,
  isActive,
}: {
  videoUrl: string;
  onClick: () => void;
  isActive: boolean;
}) {
  const videoType = detectVideoType(videoUrl);

  const getThumbnailEmbedUrl = (): string | null => {
    switch (videoType) {
      case "youtube": return getYouTubeEmbedUrl(videoUrl, false);
      case "vimeo": return getVimeoEmbedUrl(videoUrl, false);
      default: return null;
    }
  };

  const embedUrl = getThumbnailEmbedUrl();

  if (embedUrl) {
    return (
      <button
        onClick={onClick}
        aria-label="Watch product video"
        className={`flex-shrink-0 size-20 md:size-28 overflow-hidden border-3 transition-all rounded-md relative ${
          isActive
            ? "border-brand-500 shadow-lg ring-2 ring-brand-200"
            : "border-brand-100 hover:border-brand-300"
        }`}
      >
        <iframe
          src={embedUrl}
          className="absolute inset-0 w-full h-full pointer-events-none"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope"
          title="Video preview"
          loading="lazy"
        />
      </button>
    );
  }

  // Fallback for direct video or unknown
  return (
    <button
      onClick={onClick}
      aria-label="Watch product video"
      className={`flex-shrink-0 size-20 md:size-28 overflow-hidden border-3 transition-all rounded-md relative ${
        isActive
          ? "border-brand-500 shadow-lg ring-2 ring-brand-200"
          : "border-brand-100 hover:border-brand-300"
      }`}
    >
      <div className="w-full h-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-6 h-6 md:w-8 md:h-8 text-brand-600" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </button>
  );
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
  const containerRef = useRef<HTMLDivElement>(null);
  const videoType = detectVideoType(videoUrl);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      try {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch {}
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const renderVideo = () => {
    switch (videoType) {
      case "youtube": {
        const embedUrl = getYouTubeEmbedUrl(videoUrl, true);
        if (!embedUrl) return renderFallback();
        return (
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Product Video"
          />
        );
      }
      case "vimeo": {
        const embedUrl = getVimeoEmbedUrl(videoUrl, true);
        if (!embedUrl) return renderFallback();
        return (
          <iframe
            src={embedUrl}
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
            className="absolute inset-0 w-full h-full object-contain"
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

  const handleClose = useCallback(() => {
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

        {/* Close button */}
        {onClose && (
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

        {/* Fullscreen toggle */}
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

        {/* Video indicator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-4 z-20 bg-black/40 text-white px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-md flex items-center gap-1.5"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          Playing
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
