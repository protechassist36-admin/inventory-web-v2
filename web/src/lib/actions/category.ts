"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getCategories() {
  const session = await auth();
  if (!session?.user?.businessId) throw new Error("Unauthorized");

  const categories = await prisma.category.findMany({
    where: { businessId: session.user.businessId },
    orderBy: { name: "asc" },
  });

  return categories.map(c => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));
}

export async function createCategory(data: { name: string; description?: string }) {
  try {
    const session = await auth();
    console.log("Creating category for session:", session?.user?.businessId);
    
    if (!session?.user?.businessId) {
      console.error("Unauthorized attempt to create category - No businessId");
      throw new Error("Unauthorized");
    }

    const category = await prisma.category.create({
      data: {
        ...data,
        businessId: session.user.businessId,
      },
    });

    revalidatePath("/dashboard/inventory/categories");
    return {
      ...category,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error("CRITICAL ERROR: Failed to create category:", error);
    throw error;
  }
}

export async function updateCategory(id: string, data: { name: string; description?: string }) {
  const session = await auth();
  if (!session?.user?.businessId) throw new Error("Unauthorized");

  const category = await prisma.category.update({
    where: { id, businessId: session.user.businessId },
    data,
  });

  revalidatePath("/dashboard/inventory/categories");
  return {
    ...category,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

export async function deleteCategory(id: string) {
  const session = await auth();
  if (!session?.user?.businessId) throw new Error("Unauthorized");

  await prisma.category.delete({
    where: { id, businessId: session.user.businessId },
  });

  revalidatePath("/dashboard/inventory/categories");
}
