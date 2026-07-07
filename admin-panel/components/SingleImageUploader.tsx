"use client"

import { useFileUpload } from "@/hooks/use-file-upload"
import { Button } from "@/components/ui/button"
import { ImageIcon, UploadIcon, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface SingleImageUploaderProps {
  /** Current image preview URL (existing image or blob) */
  value: string | null
  /** Called when an image file is selected */
  onChange: (file: File | null) => void
  /** Label text above the uploader */
  label?: string
  /** Whether the field is required */
  required?: boolean
  /** Max file size in MB */
  maxSizeMB?: number
  /** Disabled state */
  disabled?: boolean
  /** Additional class names */
  className?: string
}

export default function SingleImageUploader({
  value,
  onChange,
  label = "Image",
  required = false,
  maxSizeMB = 5,
  disabled = false,
  className,
}: SingleImageUploaderProps) {
  const maxSize = maxSizeMB * 1024 * 1024

  const [, { handleDragEnter, handleDragLeave, handleDragOver, handleDrop, openFileDialog, getInputProps }] =
    useFileUpload({
      accept: "image/*",
      maxSize,
      multiple: false,
      onFilesAdded: (files) => {
        if (files.length > 0) onChange(files[0].file as File)
      },
    })

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </label>
      </div>

      <div
        onDragEnter={disabled ? undefined : handleDragEnter}
        onDragLeave={disabled ? undefined : handleDragLeave}
        onDragOver={disabled ? undefined : handleDragOver}
        onDrop={disabled ? undefined : (e) => { e.preventDefault(); if (!disabled) handleDrop(e) }}
        className="relative flex min-h-[140px] flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-input p-4 transition-colors has-[input:focus]:border-ring has-[input:focus]:ring-[3px] has-[input:focus]:ring-ring/50 data-[dragging=true]:bg-accent/50"
      >
        <input {...getInputProps({ disabled })} className="sr-only" aria-label={`Upload ${label.toLowerCase()}`} />

        {value ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <img src={value} alt="Preview" className="max-h-[140px] w-auto rounded-lg object-contain" />
            <Button
              type="button"
              onClick={() => onChange(null)}
              size="icon"
              variant="destructive"
              className="absolute -top-2 -right-2 size-6 rounded-full border-2 border-background shadow-none"
              disabled={disabled}
              aria-label="Remove image"
            >
              <XIcon className="size-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
            <div className="mb-2 flex size-10 shrink-0 items-center justify-center rounded-full border bg-background" aria-hidden="true">
              <ImageIcon className="size-4 opacity-60" />
            </div>
            <p className="mb-1 text-sm font-medium">Drop your image here</p>
            <p className="text-xs text-muted-foreground">PNG, JPG or WEBP (max. {maxSizeMB}MB)</p>
            <Button type="button" variant="outline" className="mt-3" onClick={openFileDialog} disabled={disabled}>
              <UploadIcon className="-ms-1 size-3.5 opacity-60" aria-hidden="true" />
              Select file
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
