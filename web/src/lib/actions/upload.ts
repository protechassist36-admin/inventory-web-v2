"use server";

import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";

async function processAndSaveImage(file: File, subDir: string) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Process image with Sharp
  const processedBuffer = await sharp(buffer)
    .resize(800, 800, { fit: "cover" }) // Auto-crop and resize
    .webp({ quality: 80 }) // Compress and convert to webp
    .toBuffer();

  const fileName = `${Date.now()}-${file.name.split('.')[0].replace(/[^a-z0-9]/gi, '_').toLowerCase()}.webp`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", subDir);
  
  // Ensure directory exists
  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (error) {
    console.error(`Failed to create directory ${uploadDir}:`, error);
  }

  await writeFile(path.join(uploadDir, fileName), processedBuffer);

  return `/uploads/${subDir}/${fileName}`;
}

export async function uploadProductImage(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file uploaded");

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) throw new Error("Invalid file type. Please upload an image (JPEG, PNG, WEBP, GIF).");

  // Validate size (5MB limit for more flexibility)
  if (file.size > 5 * 1024 * 1024) throw new Error("File too large (max 5MB)");

  return await processAndSaveImage(file, "products");
}

export async function uploadBusinessLogo(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file uploaded");

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) throw new Error("Invalid file type");

  if (file.size > 2 * 1024 * 1024) throw new Error("Logo too large (max 2MB)");

  return await processAndSaveImage(file, "logos");
}
