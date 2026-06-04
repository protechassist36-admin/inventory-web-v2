"use server";

import { getTenantPrisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function getProductProfitability(start: Date, end: Date) {
  try {
    const session = await auth();
    if (!session?.user?.businessId) throw new Error("Unauthorized");

    const prisma = getTenantPrisma(session.user.businessId);

    const saleItems = await prisma.saleItem.findMany({
      where: {
        sale: {
          createdAt: { gte: start, lte: end },
          paymentStatus: 'PAID'
        }
      },
      include: {
        product: {
          select: { name: true, costPrice: true }
        }
      }
    });

    const productMap: Record<string, { name: string, totalRevenue: number, totalCost: number, quantity: number }> = {};

    saleItems.forEach(item => {
      const productId = item.productId || 'unknown';
      const name = item.productName || item.product?.name || "Unknown Product";
      const cost = Number(item.product?.costPrice || 0);
      const revenue = Number(item.total);
      
      if (!productMap[productId]) {
        productMap[productId] = { name, totalRevenue: 0, totalCost: 0, quantity: 0 };
      }
      
      productMap[productId].totalRevenue += revenue;
      productMap[productId].totalCost += (cost * item.quantity);
      productMap[productId].quantity += item.quantity;
    });

    return Object.entries(productMap).map(([id, data]) => ({
      id,
      ...data,
      profit: data.totalRevenue - data.totalCost
    })).sort((a, b) => b.profit - a.profit);
  } catch (error) {
    console.error("Failed to fetch product profitability:", error);
    throw error;
  }
}
