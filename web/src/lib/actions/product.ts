"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notification";
import { canPerformAction } from "@/lib/subscriptions";
import { checkAccess } from "@/lib/rbac";

export async function getProducts() {
  try {
    const session = await auth();
    console.log("DEBUG: getProducts session:", !!session, "User ID:", session?.user?.id);
    if (!session?.user?.businessId) throw new Error("Unauthorized");

    const products = await prisma.product.findMany({
      where: { businessId: session.user.businessId },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    return products.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      description: p.description,
      barcode: p.barcode,
      unitPrice: p.unitPrice.toNumber(),
      costPrice: p.costPrice?.toNumber() || null,
      stockQuantity: p.stockQuantity,
      minStockLevel: p.minStockLevel,
      status: p.status,
      metadata: p.metadata,
      businessId: p.businessId,
      categoryId: p.categoryId,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      category: p.category ? {
        id: p.category.id,
        name: p.category.name,
        description: p.category.description,
        businessId: p.category.businessId,
        createdAt: p.category.createdAt.toISOString(),
        updatedAt: p.category.updatedAt.toISOString(),
      } : null,
    }));
  } catch (error) {
    console.error("Failed to fetch products:", error);
    throw error;
  }
}

export async function createProduct(data: any) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.businessId) throw new Error("Unauthorized");

    // 1. RBAC Check
    const access = await checkAccess(session.user.id, session.user.businessId, "product:create");
    if (!access.allowed) throw new Error(access.message);

    // 2. Subscription Limit Check
    const business = await prisma.business.findUnique({
      where: { id: session.user.businessId },
      select: { plan: true }
    });
    
    const productCount = await prisma.product.count({
      where: { businessId: session.user.businessId }
    });

    const check = canPerformAction(business?.plan || "FREE", "maxProducts", productCount);
    if (!check.allowed) {
      throw new Error(check.message);
    }
    
    const { 
      name, 
      sku, 
      description, 
      barcode, 
      unitPrice, 
      costPrice, 
      stockQuantity, 
      minStockLevel, 
      status, 
      categoryId, 
      metadata 
    } = data;

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        description,
        barcode,
        unitPrice,
        costPrice,
        stockQuantity,
        minStockLevel,
        status: status || "active",
        categoryId,
        metadata: metadata || {},
        businessId: session.user.businessId,
      },
    });

    if (product.stockQuantity <= product.minStockLevel) {
       await createNotification({
          title: "Low Stock Alert",
          message: `New product "${product.name}" initialized below threshold. Current: ${product.stockQuantity}`,
          type: "WARNING"
       });
    }

    revalidatePath("/dashboard/inventory/products");
    
    return {
      ...product,
      unitPrice: product.unitPrice.toNumber(),
      costPrice: product.costPrice?.toNumber() || null,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error("CRITICAL ERROR: Failed to create product:", error);
    throw error;
  }
}

export async function updateProduct(id: string, data: any) {
  try {
    const session = await auth();
    if (!session?.user?.businessId) throw new Error("Unauthorized");

    const { 
      name, 
      sku, 
      description, 
      barcode, 
      unitPrice, 
      costPrice, 
      stockQuantity, 
      minStockLevel, 
      status, 
      categoryId, 
      metadata 
    } = data;

    const product = await prisma.product.update({
      where: { id, businessId: session.user.businessId },
      data: {
        name,
        sku,
        description,
        barcode,
        unitPrice,
        costPrice,
        stockQuantity,
        minStockLevel,
        status,
        categoryId,
        metadata: metadata || {},
      },
    });

    if (product.stockQuantity <= product.minStockLevel) {
       await createNotification({
          title: "Low Stock Alert",
          message: `Product "${product.name}" stock level updated below threshold. Remaining: ${product.stockQuantity}`,
          type: "WARNING"
       });
    }

    revalidatePath("/dashboard/inventory/products");
    
    return {
      ...product,
      unitPrice: product.unitPrice.toNumber(),
      costPrice: product.costPrice?.toNumber() || null,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error("CRITICAL ERROR: Failed to update product:", error);
    throw error;
  }
}

export async function deleteProduct(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.businessId) throw new Error("Unauthorized");

    await prisma.product.delete({
      where: { id, businessId: session.user.businessId },
    });

    revalidatePath("/dashboard/inventory/products");
  } catch (error) {
    console.error("Failed to delete product:", error);
    throw error;
  }
}
