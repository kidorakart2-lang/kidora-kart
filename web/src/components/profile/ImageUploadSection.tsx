"use client";

import { useRef } from "react";
import { Camera, Upload, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ImageUploadSectionProps {
  previewImage: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}

export default function ImageUploadSection({
  previewImage,
  fileInputRef,
  onFileChange,
  onRemove,
}: ImageUploadSectionProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
        <Camera size={18} className="text-muted-foreground" />
        Profile Picture
      </h2>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="w-32 h-32 rounded-xl overflow-hidden border-2 border-dashed border-border flex items-center justify-center">
          {previewImage ? (
            <div className="relative w-full h-full group">
              <img
                src={previewImage}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <button
                onClick={onRemove}
                className="absolute top-1 right-1 bg-destructive hover:bg-destructive/90 text-background p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <Upload size={32} className="text-muted-foreground" />
          )}
        </div>

        <div className="flex-1">
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="hidden"
            id="avatar-upload"
          />
          <Label
            htmlFor="avatar-upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-border text-muted-foreground rounded-lg cursor-pointer transition-all duration-300 text-sm fw-cta"
          >
            <Upload size={16} />
            Choose Image
          </Label>
          <p className="text-xs text-muted-foreground mt-2">
            JPG, PNG or GIF. Max size 5MB.
          </p>

          {previewImage && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={onRemove}
                className="px-4 py-2 bg-border text-muted-foreground rounded-lg text-sm fw-cta hover:bg-muted-foreground/20 transition-all duration-300"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
