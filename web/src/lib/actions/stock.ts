"use server";

import { prisma, getTenantPrisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getExpiringBatches() {
  try {
    const session = await auth();
    if (!session?.user?.businessId) throw new Error("Unauthorized");
    
    const batches = await prisma.batch.findMany({
      where: { 
          businessId: session.user.businessId,
          expiryDate: { not: null } 
      },
      include: { product: true },
      orderBy: { expiryDate: "asc" }
    });
    
    return batches.map(b => ({
      ...b,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
      expiryDate: b.expiryDate?.toISOString() || null,
      manufacturingDate: b.manufacturingDate?.toISOString() || null,
      product: b.product ? {
        ...b.product,
        unitPrice: b.product.unitPrice.toNumber(),
        costPrice: b.product.costPrice?.toNumber() || null,
        createdAt: b.product.createdAt.toISOString(),
        updatedAt: b.product.updatedAt.toISOString(),
        deletedAt: b.product.deletedAt?.toISOString() || null,
      } : null
    }));
  } catch (error) {
    console.error("Failed to fetch expiring batches:", error);
    throw error;
  }
}

export async function getStockMovements() {
  try {
    const session = await auth();
    if (!session?.user?.businessId) throw new Error("Unauthorized");

    const movements = await prisma.stockMovement.findMany({
      where: { businessId: session.user.businessId },
      include: {
        product: true,
        user: {
          select: {
            name: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    return movements.map(m => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
      product: m.product ? {
        ...m.product,
        unitPrice: m.product.unitPrice.toNumber(),
        costPrice: m.product.costPrice?.toNumber() || null,
        createdAt: m.product.createdAt.toISOString(),
        updatedAt: m.product.updatedAt.toISOString(),
        deletedAt: m.product.deletedAt?.toISOString() || null,
      } : null
    }));
  } catch (error) {
    console.error("Failed to fetch stock movements:", error);
    throw error;
  }
}

export async function adjustStock(data: {
  productId: string;
  quantity: number;
  type: "IN" | "OUT" | "ADJUSTMENT" | "RETURN";
  reason?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.businessId || !session?.user?.id) throw new Error("Unauthorized");

    const businessId = session.user.businessId;
    const userId = session.user.id;
    const prisma = getTenantPrisma(businessId);

    await prisma.$transaction(async (tx) => {
      // 1. Update product quantity
      const adjustment = data.type === "IN" || data.type === "RETURN" ? data.quantity : -data.quantity;

      await tx.product.update({
        where: { id: data.productId },
        data: {
          stockQuantity: {
            increment: adjustment,
          },
        },
      });

      // 2. Record movement
      await tx.stockMovement.create({
        data: {
          productId: data.productId,
          quantity: data.quantity,
          type: data.type,
          reason: data.reason || "Manual Adjustment",
          userId: userId,
          businessId: businessId,
        },
      });
    });

    revalidatePath("/dashboard/inventory/products");
    return { success: true };
  } catch (error) {
    console.error("Failed to adjust stock:", error);
    throw error;
  }
}
