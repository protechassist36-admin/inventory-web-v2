"use server";

import { getTenantPrisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function getSalesOrderSummary(start: Date, end: Date) {
  try {
    const session = await auth();
    if (!session?.user?.businessId) throw new Error("Unauthorized");

    const prisma = getTenantPrisma(session.user.businessId);

    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        paymentStatus: 'PAID', // Filter PAID only
      },
      select: {
        totalAmount: true,
        status: true,
      },
    });

    const summary = sales.reduce(
      (acc, sale) => {
        // Handle potential Decimal conversion issues defensively
        const amount = typeof sale.totalAmount === 'number' 
          ? sale.totalAmount 
          : (sale.totalAmount as any).toNumber?.() || Number(sale.totalAmount) || 0;
        
        acc.totalAmount += amount;
        acc.totalOrders += 1;

        const status = (sale.status || "PENDING").toLowerCase();
        if (!acc.statusSummary[status]) {
          acc.statusSummary[status] = { count: 0, amount: 0 };
        }
        acc.statusSummary[status].count += 1;
        acc.statusSummary[status].amount += amount;

        return acc;
      },
      {
        totalOrders: 0,
        totalAmount: 0,
        statusSummary: {} as Record<string, { count: number; amount: number }>,
      }
    );

    return summary;
  } catch (error: any) {
    console.error("SUMMARY SYNC ERROR:", error);
    throw new Error(`Summary Registry Sync Failed: ${error.message}`);
  }
}
