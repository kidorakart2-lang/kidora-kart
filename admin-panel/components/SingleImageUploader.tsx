import React from 'react'
import { Label } from './ui/label'
import { ImageIcon } from 'lucide-react'

export default function SingleImageUploader({
    imagePreview,
    handleImageChange,
    editingLogo
}: {
    imagePreview: string | null;
    handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    editingLogo: boolean;
}) {
  return (
     <div className="space-y-2">
                 <Label>Logo Image *</Label>
                 <div className="flex items-center justify-center w-full">
                   <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                     {imagePreview ? (
                       <img
                         src={imagePreview}
                         alt="Preview"
                         className="h-full w-full object-contain p-2"
                       />
                     ) : (
                       <div className="flex flex-col items-center justify-center pt-5 pb-6">
                         <ImageIcon className="w-8 h-8 mb-2 text-muted-foreground" />
                         <p className="text-sm text-muted-foreground text-center px-4">
                           Click to upload or drag and drop
                         </p>
                         <p className="text-xs text-muted-foreground mt-1">
                           SVG, PNG, or JPG (MAX. 5MB)
                         </p>
                       </div>
                     )}
                     <input
                       id="logo-upload"
                       type="file"
                       className="hidden"
                       accept="image/*"
                       onChange={handleImageChange}
                       required={!editingLogo}
                     />
                   </label>
                 </div>
               </div>
  )
}
