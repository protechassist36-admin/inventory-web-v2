"use server";

import { writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import fs from "fs";

async function processAndSaveImage(file: File, subDir: string) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Process image with Sharp
  const processedBuffer = await sharp(buffer)
    .resize(800, 800, { fit: "cover" }) // Auto-crop and resize
    .webp({ quality: 80 }) // Compress and convert to webp
    .toBuffer();

  const fileName = `${Date.now()}-${file.name.split('.')[0].replace(/[^a-z0-9]/gi, '_').toLowerCase()}.webp`;
  
  let baseDir = process.cwd();
  let publicPath = "";
  
  // Check common project structures
  if (fs.existsSync(path.join(baseDir, "web", "public"))) {
    publicPath = path.join(baseDir, "web", "public", "uploads", subDir);
  } else if (fs.existsSync(path.join(baseDir, "public"))) {
    publicPath = path.join(baseDir, "public", "uploads", subDir);
  } else if (baseDir.endsWith('web')) {
     publicPath = path.join(baseDir, "public", "uploads", subDir);
  } else {
    // Ultimate fallback
    publicPath = path.join(baseDir, "public", "uploads", subDir);
  }

  console.log(`DEBUG: Target Path: ${publicPath}`);
  
  // Ensure directory exists
  if (!fs.existsSync(publicPath)) {
    fs.mkdirSync(publicPath, { recursive: true });
    console.log(`DEBUG: Created DIR: ${publicPath}`);
  }

  const finalFilePath = path.join(publicPath, fileName);
  await writeFile(finalFilePath, processedBuffer);
  
  console.log(`DEBUG: Saved to: ${finalFilePath}`);

  return `/uploads/${subDir}/${fileName}`;
}

export async function uploadProductImage(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file uploaded");

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) throw new Error("Invalid file type.");

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
