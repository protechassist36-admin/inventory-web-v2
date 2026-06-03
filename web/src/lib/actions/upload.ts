"use server";

import { writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

export async function uploadProductImage(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file uploaded");

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) throw new Error("Invalid file type");

  // Validate size (2MB = 2 * 1024 * 1024 bytes)
  if (file.size > 2 * 1024 * 1024) throw new Error("File too large (max 2MB)");

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Process image with Sharp
  const processedBuffer = await sharp(buffer)
    .resize(800, 800, { fit: "cover" }) // Auto-crop and resize
    .webp({ quality: 80 }) // Compress and convert to webp
    .toBuffer();

  const fileName = `${Date.now()}-${file.name.split('.')[0]}.webp`;
  const uploadDir = path.join(process.cwd(), "public/uploads/products");
  
  // Ensure directory exists (Next.js handles this, but good practice)
  await writeFile(path.join(uploadDir, fileName), processedBuffer);

  return `/uploads/products/${fileName}`;
}
