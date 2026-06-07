"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Upload, X, Camera, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  uploadAction: (formData: FormData) => Promise<string>;
  label?: string;
}

export function ImageUploader({ value, onChange, uploadAction, label = "Product Imagery" }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const imageUrl = await uploadAction(formData);
      setPreview(imageUrl);
      onChange(imageUrl);
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload image");
      console.error(error);
    } finally {
      setLoading(false);
      // Reset inputs
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  };

  const triggerUpload = () => fileInputRef.current?.click();
  const triggerCamera = () => cameraInputRef.current?.click();

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="relative group w-full aspect-square max-w-[200px] mx-auto overflow-hidden rounded-2xl border-4 border-white dark:border-slate-800 shadow-xl">
          <Image src={preview} alt="Preview" fill className="object-cover transition-transform group-hover:scale-105" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button 
                variant="destructive" 
                size="icon" 
                className="h-10 w-10 rounded-full shadow-lg"
                onClick={(e) => { e.preventDefault(); setPreview(null); onChange(""); }}
            >
                <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={triggerUpload}
            className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-primary hover:bg-primary/5 transition-all group"
          >
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 group-hover:bg-primary/10 transition-colors">
              {loading ? <Loader2 className="h-6 w-6 text-primary animate-spin" /> : <ImageIcon className="h-6 w-6 text-slate-400 group-hover:text-primary" />}
            </div>
            <div className="text-center">
                <span className="block text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Upload</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">From Device</span>
            </div>
            <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={handleUpload} 
            />
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={triggerCamera}
            className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-500/5 transition-all group"
          >
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 group-hover:bg-indigo-500/10 transition-colors">
              <Camera className="h-6 w-6 text-slate-400 group-hover:text-indigo-500" />
            </div>
            <div className="text-center">
                <span className="block text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Camera</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Take Photo</span>
            </div>
            <input 
                ref={cameraInputRef}
                type="file" 
                className="hidden" 
                accept="image/*" 
                capture="environment"
                onChange={handleUpload} 
            />
          </button>
        </div>
      )}
      {loading && (
        <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">
            <Loader2 className="h-3 w-3 animate-spin" />
            AI Image Processing...
        </div>
      )}
    </div>
  );
}
