"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createPurchase(data: {
  supplierId?: string;
  items: { productId: string; quantity: number; unitCost: number; total: number }[];
  totalAmount: number;
  invoiceNumber?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.businessId || !session?.user?.id) throw new Error("Unauthorized");

    const businessId = session.user.businessId;
    const userId = session.user.id;

    const purchase = await prisma.$transaction(async (tx) => {
      // 1. Create the Purchase record
      const newPurchase = await tx.purchase.create({
        data: {
          invoiceNumber: data.invoiceNumber || `PUR-${Date.now()}`,
          totalAmount: data.totalAmount,
          supplierId: data.supplierId,
          businessId: businessId,
          userId: userId,
          items: {
            create: data.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              total: item.total,
            })),
          },
        },
      });

      // 2. Update Stock Levels and record Stock Movements
      for (const item of data.items) {
        await tx.product.update({
          where: { id: item.productId, businessId: businessId },
          data: {
            stockQuantity: {
              increment: item.quantity,
            },
            costPrice: item.unitCost, // Update cost price to the latest purchase price
          },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            type: "IN",
            reason: `Purchase ${newPurchase.invoiceNumber}`,
            businessId: businessId,
            userId: userId,
          },
        });
      }

      return newPurchase;
    });

    revalidatePath("/dashboard/inventory/products");
    revalidatePath("/dashboard/inventory/purchases");
    
    return { 
      success: true, 
      purchaseId: purchase.id,
      totalAmount: purchase.totalAmount.toNumber(),
      createdAt: purchase.createdAt.toISOString()
    };
  } catch (error) {
    console.error("Failed to process purchase:", error);
    throw error;
  }
}

export async function getPurchases() {
  try {
    const session = await auth();
    if (!session?.user?.businessId) throw new Error("Unauthorized");

    const purchases = await prisma.purchase.findMany({
      where: { businessId: session.user.businessId },
      orderBy: { createdAt: "desc" },
      include: {
        supplier: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    return purchases.map(p => ({
      ...p,
      totalAmount: p.totalAmount.toNumber(),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      supplier: p.supplier ? {
        ...p.supplier,
        createdAt: p.supplier.createdAt.toISOString(),
        updatedAt: p.supplier.updatedAt.toISOString(),
      } : null,
      items: p.items.map(item => ({
        ...item,
        unitCost: item.unitCost.toNumber(),
        total: item.total.toNumber(),
        product: item.product ? {
          ...item.product,
          unitPrice: item.product.unitPrice.toNumber(),
          costPrice: item.product.costPrice?.toNumber() || null,
          createdAt: item.product.createdAt.toISOString(),
          updatedAt: item.product.updatedAt.toISOString(),
          deletedAt: item.product.deletedAt?.toISOString() || null,
        } : null
      }))
    }));
  } catch (error) {
    console.error("Failed to fetch purchases:", error);
    throw error;
  }
}
