"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { uploadProductImage } from "@/lib/actions/upload";
import { toast } from "sonner";

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
}

export function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be under 2MB");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const imageUrl = await uploadProductImage(formData);
      setPreview(imageUrl);
      onChange(imageUrl);
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload image");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="relative w-40 h-40">
          <Image src={preview} alt="Preview" fill className="rounded-lg object-cover" />
          <Button 
            variant="destructive" 
            size="icon" 
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={() => { setPreview(null); onChange(""); }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center gap-2">
          <Upload className="h-8 w-8 text-slate-400" />
          <label className="cursor-pointer text-sm font-bold text-indigo-600">
            Upload Image
            <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
          </label>
        </div>
      )}
      {loading && <p className="text-xs text-slate-500">Processing and uploading...</p>}
    </div>
  );
}
