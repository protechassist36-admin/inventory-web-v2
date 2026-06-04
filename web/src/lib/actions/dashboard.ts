"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { addDays, startOfDay, endOfDay } from "date-fns";

export async function getDashboardStats() {
  try {
    const session = await auth();
    if (!session?.user?.businessId) throw new Error("Unauthorized");
    const businessId = session.user.businessId;

    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    const [
      revenueData,
      ordersCount,
      skuCount,
      lowStockCount,
      expiringCount,
      activeTransactions,
      staffCount
    ] = await Promise.all([
      // Total Revenue (Paid Sales)
      prisma.sale.aggregate({
        where: { 
          businessId,
          paymentStatus: "PAID"
        },
        _sum: {
          totalAmount: true
        }
      }),
      // Total Paid Orders
      prisma.sale.count({
        where: { 
          businessId,
          paymentStatus: "PAID"
        }
      }),
      // SKU Count
      prisma.product.count({
        where: { businessId }
      }),
      // Low Stock Count
      prisma.$queryRawUnsafe<{ count: number }[]>(`
        SELECT COUNT(*)::int as count FROM "Product" 
        WHERE "businessId" = $1 AND "stockQuantity" <= "minStockLevel"
      `, businessId),
      // Expiring Items (within 30 days)
      prisma.batch.count({
        where: {
          businessId,
          expiryDate: {
            not: null,
            lt: addDays(new Date(), 30)
          }
        }
      }),
      // Today's Transactions
      prisma.sale.count({
        where: {
          businessId,
          createdAt: {
            gte: todayStart,
            lte: todayEnd
          }
        }
      }),
      // Staff Count
      prisma.user.count({
        where: { businessId }
      })
    ]);

    return {
      revenue: Number(revenueData._sum.totalAmount || 0),
      orders: ordersCount,
      skuCount: skuCount,
      lowStock: lowStockCount[0]?.count || 0,
      expiringItems: expiringCount,
      activeTransactions: activeTransactions,
      staffCount: staffCount
    };
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    throw error;
  }
}
