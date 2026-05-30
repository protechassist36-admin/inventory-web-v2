"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function processReturn(data: {
  saleId: string;
  items: { productId: string; quantity: number }[];
  reason?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.businessId || !session?.user?.id) throw new Error("Unauthorized");

    const businessId = session.user.businessId;
    const userId = session.user.id;

    await prisma.$transaction(async (tx) => {
      for (const item of data.items) {
        // 1. Update Stock (Increment back)
        await tx.product.update({
          where: { id: item.productId, businessId: businessId },
          data: {
            stockQuantity: {
              increment: item.quantity,
            },
          },
        });

        // 2. Record Stock Movement (Type RETURN)
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            type: "RETURN",
            reason: data.reason || `Returned from Sale ${data.saleId}`,
            businessId: businessId,
            userId: userId,
          },
        });
      }

      // 3. Mark Sale as partially/fully returned if needed
      // For now, we'll just log it. A more robust system would update the Sale model status.
    });

    revalidatePath("/dashboard/inventory/products");
    revalidatePath("/dashboard/inventory/history");
    
    return { success: true, timestamp: new Date().toISOString() };
  } catch (error) {
    console.error("Failed to process return:", error);
    throw error;
  }
}

export async function getReturns() {
  try {
    const session = await auth();
    if (!session?.user?.businessId) throw new Error("Unauthorized");

    const returns = await prisma.stockMovement.findMany({
      where: { 
        businessId: session.user.businessId,
        type: "RETURN"
      },
      orderBy: { createdAt: "desc" },
      include: {
        product: true,
        user: true
      }
    });

    return returns.map(r => ({
      id: r.id,
      productName: r.product?.name || "Unknown Product",
      quantity: r.quantity,
      reason: r.reason,
      createdAt: r.createdAt.toISOString(),
      userName: r.user?.name || "System"
    }));
  } catch (error) {
    console.error("Failed to fetch returns:", error);
    throw error;
  }
}
