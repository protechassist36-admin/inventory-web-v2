"use server";

import { prisma as globalPrisma, getTenantPrisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay } from "date-fns";

export async function getCashFlowData() {
  try {
    const session = await auth();
    if (!session?.user?.businessId) throw new Error("Unauthorized");
    const businessId = session.user.businessId;

    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    const prisma = getTenantPrisma(businessId);

    // Fetch Sales and Expenses in parallel directly here to avoid module issues
    const [salesRaw, expensesRaw] = await Promise.all([
      prisma.sale.findMany({
        where: { createdAt: { gte: start, lte: end } },
        orderBy: { createdAt: "asc" }
      }),
      prisma.expense.findMany({
        where: { date: { gte: start, lte: end } },
        orderBy: { date: "asc" }
      })
    ]);

    const sales = salesRaw.map(s => ({
      totalAmount: s.totalAmount.toNumber(),
      createdAt: s.createdAt.toISOString()
    }));

    const expenses = expensesRaw.map(e => ({
      amount: e.amount.toNumber(),
      date: e.date.toISOString()
    }));

    const days = eachDayOfInterval({ start, end });

    const dailyData = days.map(day => {
      const daySales = sales
        .filter(s => isSameDay(new Date(s.createdAt), day))
        .reduce((sum, s) => sum + s.totalAmount, 0);
      
      const dayExpenses = expenses
        .filter(e => isSameDay(new Date(e.date), day))
        .reduce((sum, e) => sum + e.amount, 0);

      return {
        name: format(day, "MMM dd"),
        inflow: daySales,
        outflow: dayExpenses,
        net: daySales - dayExpenses
      };
    });

    const totalInflow = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalOutflow = expenses.reduce((sum, e) => sum + e.amount, 0);

    return {
      dailyData,
      summary: {
        totalInflow,
        totalOutflow,
        netCashFlow: totalInflow - totalOutflow,
        burnRate: totalInflow > 0 ? (totalOutflow / totalInflow) * 100 : 0
      }
    };
  } catch (error) {
    console.error("CASHFLOW ERROR: Aggregation failed:", error);
    throw new Error("Financial nodes aggregation failed. Ensure database sync is complete.");
  }
}
