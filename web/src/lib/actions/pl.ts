"use server";

import { getTenantPrisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function getProfitLossData(start: Date, end: Date) {
  try {
    const session = await auth();
    if (!session?.user?.businessId) throw new Error("Unauthorized");

    const prisma = getTenantPrisma(session.user.businessId);

    // 1. Get PAID Sales
    const sales = await prisma.sale.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        paymentStatus: 'PAID'
      },
      select: { totalAmount: true, createdAt: true }
    });

    // 2. Get Expenses
    const expenses = await prisma.expense.findMany({
      where: {
        date: { gte: start, lte: end }
      },
      select: { amount: true }
    });

    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const netProfit = totalRevenue - totalExpenses;

    return {
      totalRevenue,
      totalExpenses,
      netProfit
    };
  } catch (error) {
    console.error("Failed to fetch P&L data:", error);
    throw error;
  }
}
