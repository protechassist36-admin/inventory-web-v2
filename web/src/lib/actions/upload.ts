"use server";

import cloudinary from "@/lib/cloudinary";

async function uploadToCloudinary(file: File, folder: string, removeBackground = false) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64Image = `data:${file.type};base64,${Buffer.from(buffer).toString("base64")}`;

  const uploadOptions: any = {
    folder: `inventory/${folder}`,
    resource_type: "image",
    transformation: [
      { width: 800, height: 800, crop: "fill", gravity: "auto" },
      { fetch_format: "webp", quality: "auto:best" }
    ],
  };

  if (removeBackground) {
    uploadOptions.background_removal = "cloudinary_ai";
  }

  return new Promise<string>((resolve, reject) => {
    cloudinary.uploader.upload(base64Image, uploadOptions, (error, result) => {
      if (error) reject(error);
      else resolve(result?.secure_url || "");
    });
  });
}

export async function uploadProductImage(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file uploaded");
  return await uploadToCloudinary(file, "products", true);
}

export async function uploadBusinessLogo(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file uploaded");
  return await uploadToCloudinary(file, "logos", false);
}
